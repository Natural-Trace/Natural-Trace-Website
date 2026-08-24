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
 *   GET /jars      count a scan, redirect to the reveal page
 *   GET /malt      superseded path, still works, counted as malt
 *   GET /protein   superseded path, still works, counted as protein
 *   GET /milo      superseded path, still works, counted as malt
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
// site. The path is what gets printed, so keep it short and never reuse one
// that is already on paper for something else.
//
// `code` is the counting bucket and `target` is where the scan lands. They are
// separate so that several paths can share a page while keeping their own
// counts, which is what makes a path survive being superseded.
//
// The stand carried a code per jar until 24 Aug, when Alrik asked for a single
// code and a single page — which is also what the printed stand card already
// shows. /jars is that code. The three older paths still resolve and still
// count under their own names, so anything generated earlier keeps working and
// stays attributable; they can go once this event is over.
//
// The cost of one code is that a scan can no longer say which jar prompted it.
// There is only one thing to scan, so there is nothing to distinguish. If the
// per-jar split is ever wanted back, print two codes pointing at /malt and
// /protein: both already work, both already count separately, and they now
// land on the same combined page, so nothing else has to change.
const UTM = "utm_source=qr&utm_medium=offline&utm_campaign=ip-week-2026";
const PAGE = `${SITE}/scan/?${UTM}`;

const CODES = {
  "/jars": { code: "jars", target: `${PAGE}&utm_content=jars` },
  "/malt": { code: "malt", target: `${PAGE}&utm_content=malt` },
  "/protein": { code: "protein", target: `${PAGE}&utm_content=protein` },
  "/milo": { code: "malt", target: `${PAGE}&utm_content=malt` },
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

async function stats(env) {
  const out = {};
  // Unique buckets, not paths: /milo and /malt share one, and listing paths
  // would report the same scans twice under two names.
  for (const code of [...new Set(Object.values(CODES).map((c) => c.code))]) {
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
