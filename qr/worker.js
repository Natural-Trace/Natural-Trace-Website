/**
 * QR scan counter for event collateral.
 *
 * The physical stand (first outing: IP Week 2026) carries a single QR code on
 * its front card. It points at this worker rather than at the site, because
 * the site cannot count scans: its only analytics is the HubSpot script, which
 * loads after the visitor accepts the cookie banner, and nobody standing at a
 * booth does that.
 * This worker records the scan server-side (no cookie, nothing personal) and
 * redirects to the reveal page in one hop, so every scan is counted whatever
 * the visitor does afterwards.
 *
 * Routes:
 *
 *   GET /jars      count a scan, redirect to the reveal page
 *   GET /stats     the counts, as JSON: total and per Singapore date
 *   anything else  redirect to the homepage, uncounted
 *
 * Each scan is stored as its own KV key, jars:<timestamp>:<random>, rather
 * than incrementing one counter. KV is eventually consistent, so two phones
 * scanning at the same moment doing get-add-put on a single key can lose one
 * of the two counts. Separate keys cannot collide, and the timestamps mean
 * /stats can show scans per day without any extra bookkeeping. The random
 * suffix covers two scans landing on the same millisecond.
 *
 * The redirect target carries UTM parameters. The worker's own count is the
 * real number; the UTMs are a bonus so that the minority who do accept
 * cookies on the site show up in HubSpot attributed to the stand.
 *
 * Deploy: see docs/qr-scan-tracking.md. One-time setup is creating the KV
 * namespace and pasting its id into wrangler.toml. No secrets involved.
 */

const SITE = "https://natural-trace.com";

// Adding a code for the next event is one line here plus a reveal page on the
// site. The path is what gets printed, so keep it short and never reuse one
// that is already on paper for something else.
//
// `code` is the counting bucket and `target` is where the scan lands. They stay
// separate fields so that a second path could share this page while keeping its
// own count, which is what made the earlier renames survivable.
//
// One path now. There were four: /jars plus /malt, /protein and /milo, kept
// alive so that anything generated during the renames would still resolve. None
// of them was ever printed. The stand went out with a single code on its card
// and today is its first day, so the aliases were protecting nothing and are
// gone. Anything else still redirects to the homepage uncounted, so a mistyped
// or half-read URL fails soft rather than 404ing.
const UTM = "utm_source=qr&utm_medium=offline&utm_campaign=ip-week-2026";

const CODES = {
  "/jars": { code: "jars", target: `${SITE}/scan/?${UTM}&utm_content=jars` },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const hit = CODES[url.pathname];
    if (hit) return recordScan(hit.code, hit.target, request, env, ctx);

    if (url.pathname === "/stats") return stats(env);

    // A mistyped or truncated URL still lands somewhere sensible. Uncounted on
    // purpose: it did not come from a code we printed.
    return Response.redirect(SITE + "/", 302);
  },
};

function recordScan(code, target, request, env, ctx) {
  // waitUntil lets the redirect leave immediately and the write finish behind
  // it. A visitor on booth wifi should not wait on KV before seeing a page.
  const key = `${code}:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
  ctx.waitUntil(
    env.SCANS.put(key, "1", {
      // Country only, from Cloudflare's own edge data: enough to tell booth
      // scans from a stray share of the link abroad, and nothing personal.
      metadata: { country: request.cf?.country || "unknown" },
    })
  );
  return Response.redirect(target, 302);
}

/* Singapore, not UTC. The keys are written in UTC because that is what
   toISOString gives and it sorts correctly, but nobody reading this is in UTC:
   an evening scan at the stand landed on the next day's line, which is a
   reconciliation problem at exactly the moment someone is reading the number
   out. Singapore is UTC+8 with no daylight saving, so a fixed offset is right
   all year and there is no need to carry a timezone database into a worker.

   An array rather than an object, because the order is the point. Object key
   order is an implementation detail; a sorted array says oldest first and keeps
   saying it. */
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;
const ISO_LENGTH = 24; // 2026-08-26T05:47:46.123Z

function toSgt(iso) {
  return new Date(new Date(iso).getTime() + SGT_OFFSET_MS).toISOString();
}

async function stats(env) {
  const byDate = {};
  let total = 0;
  let latest = null;

  for (const { code } of Object.values(CODES)) {
    // list() pages at 1000 keys. The loop matters even though one event will
    // not get near that: without it the day this breaks is the day the count
    // is most interesting.
    let cursor;
    do {
      const page = await env.SCANS.list({ prefix: `${code}:`, cursor });
      for (const k of page.keys) {
        // Slice by length rather than splitting on ":", because the timestamp
        // contains two of its own.
        const iso = k.name.slice(code.length + 1, code.length + 1 + ISO_LENGTH);
        const sgt = toSgt(iso);
        const date = sgt.slice(0, 10);
        byDate[date] = (byDate[date] || 0) + 1;
        if (!latest || sgt > latest) latest = sgt;
        total += 1;
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  const body = {
    total,
    timezone: "Singapore (UTC+8)",
    last_scan: latest ? latest.slice(0, 16).replace("T", " ") : null,
    by_date: Object.keys(byDate)
      .sort()
      .map((date) => ({ date, scans: byDate[date] })),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
