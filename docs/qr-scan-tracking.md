# QR scan tracking for event stands

First used for the IP Week 2026 stand: two jars of the same brown powder, one
QR code on the stand card, and the question "could you tell which one is
authentic?". The page asks the visitor to imagine both jars sold as the same
branded protein powder, one carrying a tag and one not, and counts the scan.

The jars held two different powders until 25 August, a malt powder and a
protein powder, and the page asked which was which. Both now hold the same
powder so that the piles genuinely match.

## The pieces

Three parts, in the order a scan meets them:

1. **The printed QR code** encodes a worker URL, not a site URL:
   `https://natural-trace-qr.natural-trace.workers.dev/jars`
2. **A Cloudflare worker** (`qr/worker.js`, a sibling of the CMS auth worker)
   records the scan and redirects to the site in one hop.
3. **One reveal page** on the site, `/scan/`, content in `src/_data/scan.yml`,
   editable in the CMS under "Event QR pages". It is unlinked, out of the
   sitemap and noindex. Its only audience is someone standing at the stand.

## Why the worker exists at all

The site cannot count scans. Its only analytics is the HubSpot script, and that
loads **after** the visitor accepts the cookie banner. At a booth almost nobody
does, so linking the QR straight to the site would count a fraction of the
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
first: a scan before the page exists just lands on a 404 after being counted.

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

returns JSON: a total, the time of the most recent scan, and a breakdown by
date, oldest first. The URL is public on purpose: it exposes nothing but how
many times the stand was scanned, and a secret would mean one more thing to
manage for a number that goes on a slide anyway.

Dates are Singapore, not UTC. The keys are written in UTC because that is what
toISOString gives and because it sorts correctly, but nobody reading the number
is in UTC: an evening scan at a stand used to land on the next day's line, which
is a reconciliation problem at exactly the moment someone is reading it out.
Singapore is UTC+8 with no daylight saving, so the worker applies a fixed offset
rather than carrying a timezone database.

One bucket. `/malt`, `/protein` and `/milo` were kept alive through the renames
so anything generated in the meantime would still resolve, and were removed on
26 Aug: none of them was ever printed, the stand went out with a single code,
and three permanently empty rows in a number someone reads at a stand are three
chances to misread it.

Anything that is not `/jars` or `/stats` redirects to the homepage uncounted, so
a mangled or half-read URL fails soft rather than 404ing.

## The next event

One line per new code in `CODES` in `qr/worker.js` (plus a reveal page if the
new stand needs one), redeploy, generate a new QR. Never reuse a path that has
already been printed for something else. The paper keeps working as long as
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

If it is ever wanted back it now costs a deploy as well as a print run. It did
not until 26 Aug, when `/malt` and `/protein` were removed: while they existed
it was purely a printing decision. Add two entries to `CODES` pointing at the
same page with their own `code` values, deploy, and print two QR codes against
them.

## Look at the jars before writing about how they look

This rule has been true in both directions inside two days, which is why it is
written down rather than remembered.

Until 25 August the jars held two different powders and the copy could not say
they looked alike, because they did not. One was a visibly darker, redder brown
than the other, and the reader is holding their phone next to both jars while
reading the sentence. A claim the visitor disproves by glancing up is worse
than no claim, and on this stand it discredits the demonstration at the exact
moment we are asking someone to trust a measurement.

On 25 August both jars were refilled with the same powder on purpose, so the
piles now match. The copy says so, and the demonstration is stronger for it:
there is nothing left to compare, which was always the point.

So the rule is not "say they are identical", and it is not "never say it". It
is: look at the jars, then write. Nothing in this repository knows what is in a
physical jar in Singapore, and no build, test or review will ever catch this
class of error.

The printed poster is written to survive either state. "**If** these were sold
as the same product, could you tell which one is authentic?" is conditional and
holds whichever powders are in the jars. The page follows it: the opening line
says "Say both of these were sold to you as the same branded protein powder"
rather than asserting it, because the jars really hold malt powder and a
visitor who tastes one would know. Keep that conditional.

## The page states the answer, because the stand already has

The stand was photographed on 25 August. The printed card carries a tick and
"NaturalTag verified" beside one jar and a cross and "Not verified" beside the
other, directly above the jars themselves. Whatever the artwork intended, a
visitor maps those to the jars in front of them before they scan anything.

So the tap-to-reveal that used to be on this page is gone. It asked a question
the visitor had already been given the answer to, which is theatre, and it put
the page in competition with our own artwork rather than adding to it. The blur,
the veil, the pulsing instruction and the small script that drove them all went
with it.

The division of labour now is that the card says which jar is authentic and the
page says why that is knowable at all: the tag is in the product, so origin
travels with the product, and nothing about the powder itself was ever going to
tell anyone anything.

This reverses the rule that used to sit at the top of scan.yml, which said
nothing above the cards may say which jar is which. That rule was right while
the page owned the reveal. It stopped being right the moment the reveal moved
to the table.

If the stand is ever reprinted without the tick and cross, the reveal becomes
worth having again, and it is in the history rather than gone: it is the state
at commit 8b38b2f.

## The untagged jar is a finding, not an open question

The right card said "It may be the branded product, or it may not" until 25
August. That was written to stay on the right side of the science, because a
missing tag is not proof of a counterfeit. It was too tentative to be useful:
it left the visitor with a shrug at the exact point the page has something to
sell.

It now reads that the jar should carry the tag and does not, and that a batch
coming back untagged cannot be placed at the authorised source. That is both
sharper and still true. In a supply chain where tagging is in place, every
legitimate batch carries one, so an absence is a real finding about process
rather than a guess about intent. The consequence is named rather than left
abstract, and it is named on both sides: the brand whose name is on the product,
and the consumer who takes it. Those are the two parties who carry the cost of a
batch nobody can place, and they are who the room at an event like this is
actually thinking about.

What must not come back is a claim that the untagged jar is counterfeit. The
absence of a tag does not establish what the powder is, only that its origin
cannot be shown, and the page should keep saying the second thing.

## Register, and what is deliberately not said

The page is read at a conference stand by buyers and by people whose job is
intellectual property. It is written to sound measured rather than chatty: the
draft that said "Say both of these were sold to you", "the real thing" and "Tap
a pile" was rewritten on 25 Aug for that reason.

NaturalDetect is not named anywhere on this page and neither is the assay. That
is a decision, not an omission. Someone standing at a stand with a phone wants
to know what the product does for them, and naming the test invites a
conversation about method before the proposition has landed. NaturalTag is
named, because it is the thing in the jar. "Food-grade" stays; "PCR-detectable"
went with the same reasoning.

If a later edit wants the method back, the place for it is the NaturalDetect
page, which exists and is linked from the navigation.

## Copy approval

The wording in `src/_data/scan.yml` was drafted 24 Aug 2026 and rewritten on 25
Aug when the jars were refilled. It has not been through Kirsty. Things to look
at deliberately:

- **The brand in the jars is not named, and must not be.** The first draft
  named it. It was pulled on 24 Aug on Bryan's instruction: it is a third
  party's mark, and putting it in our own copy at an IP conference is the wrong
  place to be casual about someone else's trademark. The copy now names
  no brand at all: since 25 August both jars are presented as the same branded
  protein powder, the left one tagged and the right one not. The demonstration
  does not need the brand. The point is that two powders sold as the same thing
  cannot be told apart by looking, and a name does no work in that sentence.

  The URL went with it, because the address bar is copy the visitor reads too.
  The page is now `/scan/` and the worker path `/jars`, so the name appears
  nowhere. `/milo` resolved for a while as a safety net and was removed on
  26 Aug along with the other superseded paths, none of which was ever printed.
- **The opening line of the first card was cut on 24 Aug.** It read "The two
  are not even the same shade of brown, and that tells you nothing". Alrik
  read it as a double negative, and it is: two negations stacked in one
  sentence, asking the reader to hold both before the point arrives. The card
  now opens on the positive claim, "Appearance can show you that two products
  differ", which says the same thing forwards. The section above still applies:
  the replacement must not drift back into asserting the powders look alike.
- The second card originally ended "no matter how similar two products look",
  an absolute nobody has approved, on a page that publishes. It now says the
  test "confirms the product's identity and origin at batch level", the
  sanctioned formulation, and deliberately not a claim about dosage. The
  register flags this species of wording elsewhere (`tag-robust-stability`,
  `faq-binary-result`); do not reintroduce an absolute here.
- The claim wording sticks to the approved vocabulary (food-grade,
  PCR-detectable, batch-level) and none of it touches a phrase in
  `docs/claim-review.yml`, but any rewrite should keep clear of "verify
  dosage" territory. NaturalDetect verifies identity and origin, not
  quantity.
