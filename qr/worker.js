/**
 * QR scan counter for event collateral.
 *
 * The physical stand (first outing: IP Week 2026) carries one QR code per jar.
 * Each code points at this worker, not at the site, because the site cannot
 * count scans: its only analytics is the HubSpot script, which loads after the
 * visitor accepts the cookie banner, and nobody standing at a booth does that.
 * This worker records the scan server-side — no cookie, nothing personal — and
 * redirects to the reveal page in one hop, so every scan is counted whatever
 * the visitor does afterwards.
 *
 * Routes:
 *
 *   GET /milo      count a scan of the left jar, redirect to its reveal page
 *   GET /protein   count a scan of the right jar, redirect to its reveal page
 *   GET /stats     the counts, as JSON: per code, per day, and in total
 *   anything else  redirect to the homepage, uncounted
 *
 * Each scan is stored as its own KV key, milo:<timestamp>:<random>, rather
 * than incrementing one counter. KV is eventually consistent, so two phones
 * scanning at the same moment doing get-add-put on a single key can lose one
 * of the two counts — separate keys cannot collide, and the timestamps mean
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
// site. The path is what gets printed, so keep it short and never rename one
// that is already on paper somewhere.
const CODES = {
  "/milo": `${SITE}/scan/milo/?utm_source=qr&utm_medium=offline&utm_campaign=ip-week-2026&utm_content=milo`,
  "/protein": `${SITE}/scan/protein/?utm_source=qr&utm_medium=offline&utm_campaign=ip-week-2026&utm_content=protein`,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const target = CODES[url.pathname];
    if (target) return recordScan(url.pathname.slice(1), target, request, env, ctx);

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

async function stats(env) {
  const out = {};
  for (const path of Object.keys(CODES)) {
    const code = path.slice(1);
    const days = {};
    let total = 0;

    // list() pages at 1000 keys. The loop matters even though one event will
    // not get near that: without it the day this breaks is the day the count
    // is most interesting.
    let cursor;
    do {
      const page = await env.SCANS.list({ prefix: `${code}:`, cursor });
      for (const k of page.keys) {
        total += 1;
        const day = k.name.slice(code.length + 1, code.length + 11); // YYYY-MM-DD
        days[day] = (days[day] || 0) + 1;
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    out[code] = { total, by_day: days };
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
