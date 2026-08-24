# QR scan tracking for event stands

First used for the IP Week 2026 stand: two jars of brown powder (left: a
chocolate malt powder, right: chocolate protein powder), one QR code on the
stand card, and the question "could you tell which one is authentic?".
Scanning it reveals what both jars hold and counts the scan.

## The pieces

Three parts, in the order a scan meets them:

1. **The printed QR code** encodes a worker URL, not a site URL:
   `https://natural-trace-qr.natural-trace.workers.dev/jars`
2. **A Cloudflare worker** (`qr/worker.js`, a sibling of the CMS auth worker)
   records the scan and redirects to the site in one hop.
3. **One reveal page** on the site, `/scan/`, content in `src/_data/scan.yml`,
   editable in the CMS under "Event QR pages". It is unlinked, out of the
   sitemap and noindex — its only audience is someone standing at the stand.

## Why the worker exists at all

The site cannot count scans. Its only analytics is the HubSpot script, and that
loads **after** the visitor accepts the cookie banner — at a booth, almost
nobody does, so linking the QR straight to the site would count a fraction of
scans and look like a quiet event. The worker counts server-side at the moment
of scan: no cookie, no personal data stored, no consent needed, every scan
counted.

The redirect still carries UTM parameters (`utm_campaign=ip-week-2026`,
`utm_content=jars`), so the subset of visitors who *do* accept
cookies also appear in HubSpot attributed to the stand. The worker's number is
the real one; HubSpot's is a floor, not a count.

Each scan is stored as its own KV key (`jars:<timestamp>:<random>`) rather
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

Order matters for going live: the reveal page must be on the site (pushed to
`main`) before the code is printed, but the worker can be deployed and tested
first — a scan before the page exists just lands on a 404 after being counted.

Redeploy the worker whenever a path or a redirect target changes. The site and
the worker deploy separately, so a rename pushed to `main` without a
`wrangler deploy` leaves the code pointing at a URL that no longer exists. That
happened on 24 Aug and the symptom is a 404 after a successful scan.

Test after deploying: open the worker URL on a phone, check you land on the
reveal page, then open `/stats` and confirm the scan is there.

## Reading the counts

```
https://natural-trace-qr.natural-trace.workers.dev/stats
```

returns JSON: per code path, a total and a per-day breakdown. The URL is public
on purpose — it exposes nothing but how many times the stand was scanned, and a
secret would mean one more thing to manage for a number that goes on a slide
anyway.

`jars` is the live bucket. `malt`, `protein` and `milo` are older paths kept
alive and still counted separately; anything in them is either a pre-24-Aug
test or someone scanning a superseded code.

Anything that is not a code path or `/stats` redirects to the homepage
uncounted, so a mangled reprint of the URL fails soft.

## The next event

One line per new code in `CODES` in `qr/worker.js` (plus a reveal page if the
new stand needs one), redeploy, generate a new QR. Never reuse a path that has
already been printed for something else — the paper keeps working as long as
the path keeps meaning what it meant.

Renaming one is survivable, as the `/milo` to `/malt` to `/jars` moves showed:
keep the old path in `CODES`, and every code already in the world carries on
working while new ones use the new name. Because `code` and `target` are
separate fields, an old path can point at the current page while still counting
under its own name, so nothing is stranded and nothing is silently merged.

## One code, not two

The stand had a code per jar until 24 Aug, when Alrik asked for one code and
one page. That is also what the printed stand card already showed: it carries a
single QR, so two codes would have meant reprinting the card.

The cost is that a scan can no longer say which jar prompted it, which was the
original reason for two. With one thing to scan there is nothing to
distinguish, so the per-jar split is gone rather than merely unreported.

If it is ever wanted back, print two codes pointing at `/malt` and `/protein`.
Both still work, both still count separately, and both now land on the same
combined page — so it is a printing decision and needs no code change at all.

## Never say the two powders look identical

The first draft of `scan.yml` said the jars were "to the eye, close to
identical" and that "colour, texture and smell are easy to imitate". They are
not identical: the malt powder is a visibly darker, redder brown than the protein
powder, and the reader is holding their phone next to both jars when they read
the sentence. A claim the visitor can disprove by looking up is worse than no
claim, and on this stand it discredits the demonstration at the exact moment
we are asking them to trust a measurement.

The printed poster already gets this right — "**If** these were sold as the
same product, could you tell which one is authentic?" is conditional, and
survives two different browns. The page follows the poster: it concedes the
difference and makes that the argument. Appearance can show two things differ;
it cannot say which one is what it claims to be, because shade moves between
batches and suppliers for ordinary reasons. The wording of that argument
changed on 24 Aug (see Copy approval below) but the argument did not.

If the jars are ever refilled with better-matched powders, this copy still
works. Do not "tighten" it back to identical.

## Copy approval

The wording in `src/_data/scan.yml` is a first draft written 24 Aug 2026 and
has not been through Kirsty. Two things to look at deliberately:

- **The brand in the left jar is not named, and must not be.** The first draft
  named it. It was pulled on 24 Aug on Bryan's instruction: it is a third
  party's mark, and putting it in our own copy at an IP conference is the wrong
  place to be casual about someone else's trademark. It reads "a chocolate malt
  powder" throughout. The demonstration does not need the brand — the point is
  that two powders sold as the same thing cannot be told apart by looking, and
  a name does no work in that sentence.

  The URL went with it, because the address bar is copy the visitor reads too.
  The page is now `/scan/` and the worker path `/jars`, so the name appears
  nowhere. `/milo` still resolves for safety; see the comment above `CODES` in
  `qr/worker.js` for when it can go.
- **The opening line of the first card was cut on 24 Aug.** It read "The two
  are not even the same shade of brown, and that tells you nothing" — Alrik
  read it as a double negative, and it is: two negations stacked in one
  sentence, asking the reader to hold both before the point arrives. The card
  now opens on the positive claim, "Appearance can show you that two products
  differ", which says the same thing forwards. The section above still applies:
  the replacement must not drift back into asserting the powders look alike.
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
