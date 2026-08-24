# QR scan tracking for event stands

First used for the IP Week 2026 stand: two jars of near-identical brown powder
(left: Milo, right: chocolate protein powder), one QR code per jar, and the
question "could you tell which one is authentic?". Scanning a code reveals what
that jar holds and counts the scan.

## The pieces

Three parts, in the order a scan meets them:

1. **The printed QR codes** encode worker URLs, not site URLs:
   - Left jar: `https://natural-trace-qr.natural-trace.workers.dev/milo`
   - Right jar: `https://natural-trace-qr.natural-trace.workers.dev/protein`
2. **A Cloudflare worker** (`qr/worker.js`, a sibling of the CMS auth worker)
   records the scan and redirects to the site in one hop.
3. **Two reveal pages** on the site, `/scan/milo/` and `/scan/protein/`,
   content in `src/_data/scan.yml`, editable in the CMS under "Event QR pages".
   They are unlinked, out of the sitemap and noindex — their only audience is
   someone standing at the stand.

## Why the worker exists at all

The site cannot count scans. Its only analytics is the HubSpot script, and that
loads **after** the visitor accepts the cookie banner — at a booth, almost
nobody does, so linking the QR straight to the site would count a fraction of
scans and look like a quiet event. The worker counts server-side at the moment
of scan: no cookie, no personal data stored, no consent needed, every scan
counted.

The redirect still carries UTM parameters (`utm_campaign=ip-week-2026`,
`utm_content=milo`/`protein`), so the subset of visitors who *do* accept
cookies also appear in HubSpot attributed to the stand. The worker's number is
the real one; HubSpot's is a floor, not a count.

Each scan is stored as its own KV key (`milo:<timestamp>:<random>`) rather
than incrementing a single counter, because KV is eventually consistent and a
get-add-put on one key can lose simultaneous scans. Details in the comment at
the top of `qr/worker.js`.

## One-time deploy

From `qr/`, logged into the same Cloudflare account that runs the CMS auth
worker:

```bash
npx wrangler kv namespace create SCANS
```

Paste the id it prints into `qr/wrangler.toml` where marked, then:

```bash
npx wrangler deploy
```

Order matters for going live: the reveal pages must be on the site (pushed to
`main`) before the codes are printed, but the worker can be deployed and tested
first — a scan before the pages exist just lands on a 404 after being counted.

Test after deploying: open both worker URLs on a phone, check you land on the
right reveal page, then open `/stats` and confirm both scans are there.

## Reading the counts

```
https://natural-trace-qr.natural-trace.workers.dev/stats
```

returns JSON: per code, a total and a per-day breakdown. The URL is public on
purpose — it exposes nothing but how many times each jar was scanned, and a
secret would mean one more thing to manage for a number that goes on a slide
anyway.

Anything that is not `/milo`, `/protein` or `/stats` redirects to the homepage
uncounted, so a mangled reprint of the URL fails soft.

## The next event

One line per new code in `CODES` in `qr/worker.js` (plus a reveal page if the
new stand needs one), redeploy, generate a new QR. Never rename or reuse a path
that has already been printed — the paper keeps working as long as the path
keeps existing.

## Never say the two powders look identical

The first draft of `scan.yml` said the jars were "to the eye, close to
identical" and that "colour, texture and smell are easy to imitate". They are
not identical: the Milo is a visibly darker, redder brown than the protein
powder, and the reader is holding their phone next to both jars when they read
the sentence. A claim the visitor can disprove by looking up is worse than no
claim, and on this stand it discredits the demonstration at the exact moment
we are asking them to trust a measurement.

The printed poster already gets this right — "**If** these were sold as the
same product, could you tell which one is authentic?" is conditional, and
survives two different browns. The page now follows the poster: it concedes the
difference and makes that the argument. Appearance can show two things differ;
it cannot say which one is what it claims to be, because shade moves between
batches and suppliers for ordinary reasons.

If the jars are ever refilled with better-matched powders, this copy still
works. Do not "tighten" it back to identical.

## Copy approval

The wording in `src/_data/scan.yml` is a first draft written 24 Aug 2026 and
has not been through Kirsty. Two things to look at deliberately:

- "Milo" is named on `/scan/milo/`. It is a Nestlé brand; the mention is
  factual (the jar really holds Milo) and the page is noindex and event-only,
  but naming a third-party brand on our own domain is Kirsty's call, at an IP
  conference of all places. The generic fallback is "a chocolate malt drink".
- The second card originally ended "no matter how similar two products look",
  an absolute nobody has approved, on a page that publishes. It now says the
  test "confirms the product's identity and origin at batch level" — the
  sanctioned formulation, and deliberately not a claim about dosage. The
  register flags this species of wording elsewhere (`tag-robust-stability`,
  `faq-binary-result`); do not reintroduce an absolute here.
- The claim wording sticks to the approved vocabulary (food-grade,
  PCR-detectable, batch-level) and none of it touches a phrase in
  `docs/claim-review.yml`, but any rewrite should keep clear of "verify
  dosage" territory — NaturalDetect verifies identity and origin, not
  quantity.
