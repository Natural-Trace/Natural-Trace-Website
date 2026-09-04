# Natural Trace website

Eleventy 11ty v3.1.6 + Nunjucks, content in YAML under `src/_data/`, edited by
non-technical colleagues through Decap CMS 3.15.1 at `/admin/`. Deployed to
GitHub Pages on `natural-trace.com`. Repo: `Natural-Trace/Natural-Trace-Website`.

Bryan Yan Ng, Research and Operations Officer, is the only person here who
touches code. Kirsty (copy, marketing), Alrik (co-CEO) and Ying Xiang (science)
edit through the CMS and do not use git.

## Commands

```bash
npm start                # dev server on :8080
npm run build            # build to _site
npm run check            # build + healthcheck + claim register check
npm run check:external   # also hits external links (slow, rate-limited hosts)
npm run check:claims     # claim register only
node scripts/assess-matrix.mjs   # regenerate docs/assess-matrix.html
```

`npm run check` must pass before pushing.

**The quiz answer key is generated, never committed.** `docs/assess-matrix.html`
is in nobody's git history on purpose: a Decap publish writes exactly one file,
`src/_data/assess.yml`, and knows nothing about derived artifacts, so a
checked-in copy would silently disagree with its own source the first time
anyone edited the quiz through the CMS. It would still open, still show 1,088
rows, and be quietly wrong.

If you do not have Node to hand, every Health check run builds it and attaches
it as **compatibility-quiz-answer-key** under Artifacts at the bottom of the run
page. That is the route for Alrik and Ying Xiang. It is not published on the
site, deliberately — it exposes the full scoring thresholds and the outcome
distribution.

## Hard rules

- **Never commit a HubSpot private-app token, API key or access token.** The
  contact form posts to a Cloudflare Worker; the token lives there.
- **Never put `GITHUB_CLIENT_SECRET` in a file.** It goes in with
  `wrangler secret put`, nothing else. Source for the OAuth handler is in
  `oauth/`, setup in `docs/cms-auth-setup.md`.
- **`products:` in `compat_evidence` publishes to the live site.** Only ever put
  a client's product name there if they have agreed in writing to be named.
- **Ask before anything that writes to a live system.** Pushing to `main`
  deploys. HubSpot, Gmail and the CMS are all live.
- Do not weaken a claim check or delete a register entry to make a build pass.

## The thing that will bite you: Decap rewrites files

Decap does not patch YAML. It parses a file into data and writes the whole
thing back out, so **every comment in a file the CMS can reach is deleted the
first time anyone saves it.**

This has happened twice:

- 18 Aug 2026, `src/_data/site.yml`, 76 comment lines.
- 19 Aug 2026, `src/_data/assess.yml`, 114 comment lines, including every
  `CLAIM REVIEW` marker and the citations behind the compatibility scoring.

`src/_data/home.yml` was going to be the third and the worst, at 80 lines. It
had survived only because nobody had happened to save the Home entry yet, and
regrouping that panel on 20 Aug made a save far more likely rather than less.
Those 80 lines are now in `docs/content-decisions.md` and the file carries a
signpost instead.

It happened a third time on 3 Sep 2026: `src/_data/integrations.yml` lost 86
comment lines the moment PostHog was switched on through the panel. They were
rebuilt from the previous commit into `docs/content-decisions.md` the same day
and the file now carries a signpost. **The remaining data files have not been
swept** — `about.yml` and the three solution files are the next ones worth
reading before someone opens them in the CMS.

**Do not record anything durable as a YAML comment in a file listed in
`src/admin/config.yml`.** It will be deleted, silently, by someone who was only
fixing a typo.

Durable records go in `docs/claim-review.yml`, which the CMS cannot reach
because it is not in any collection, and which `scripts/claim-check.mjs`
enforces on every build. Rewording a registered phrase fails the build on
purpose: a reworded claim is a new claim.

### Concurrency

Decap names an editorial workflow branch `cms/collectionName/entrySlug`, keyed
on the entry, not the editor. Two people editing the same section share one
branch and one pull request, and because Decap writes the whole file, the
second to publish silently replaces the first. Different sections are fine.

If you have edited a file on `main` that someone has an open CMS draft against,
their publish will revert you. Check for open `cms/` pull requests first.

## Current state, 19 August 2026

The site went live on the custom domain on 18 Aug. Savepoint tag `v1` with a
full DNS rollback record in `docs/rollback-v1.md`.

Savepoint tag `v2` at `2247d8c` marks the state before the quiz copy change and
the CI claim gate. `docs/rollback-v2.md` lists what landed on top, how to revert
each piece on its own, and the checks to run afterwards. The revert of the copy
commit was tested rather than assumed: it applies cleanly, the register goes
back with the wording, and the answer key still reports 63/124/901.

### Outstanding, in priority order

1. **The compatibility quiz is 83% "Testing required"** across all 1,088
   possible answer combinations, and only 6% "Compatible". Four decisions are
   open with Alrik and Ying Xiang before anything is changed. Do not adjust a
   band without one of those closing.
2. **CMS editability refactor**, blocked on those four decisions.
3. **Two insight images load from `pbs.twimg.com`**, a server we do not
   control. `npm run check` names them on every run. If Twitter's CDN moves or
   expires them the pages lose their images with no error anywhere. The fix is
   a content job, not a code one: re-upload both through the CMS so they are
   served from the site. Kirsty's lane.
4. **The collision comment says which draft it clashes with, but not who is
   editing it.** It links the other pull request and its title, and deliberately
   carries no branch name and no file path, because neither is something Kirsty
   or Alrik can act on. Testing it for real on 19 Aug showed up the gap: it ends
   by saying "ask whoever looks after the website", and naming the other editor
   would answer that outright. It is a two-line change to `body ()` in
   `cms-draft-notice.yml`, left alone on purpose — the wording of anything that
   gets sent to an editor is Kirsty's to approve, not a thing to change quietly.

### Closed on 19 August

- **`cms-draft-notice.yml` has now been fired against real GitHub**, both
  halves, using four throwaway pull requests (#14-#17, all closed, branches
  deleted). Two drafts on the same file and different lines: both got exactly
  one comment, including the draft that was opened first, which is the half
  that did not exist before and belongs to the person with work to lose. A
  second push to one of them re-ran the job and posted nothing new — the marker
  dedup holds against a real, slow `gh`, which is precisely the code path the
  SIGPIPE bug lived in. Two drafts on different files, opened while the
  colliding pair was still live: `Tell both editors` reported `skipped`, so the
  condition was evaluated and declined rather than quietly passing. The one
  thing the run log does not say is how many other drafts it examined, so a
  genuine negative and a list that came back empty print the same line.
- **The Actions default workflow permission on this repository is `read`**,
  from `gh api repos/Natural-Trace/Natural-Trace-Website/actions/permissions/workflow`.
  The collision job can comment only because it declares `pull-requests: write`
  in its own `permissions:` block, which overrides that default; the run log
  confirms the token is issued as `PullRequests: write`. **Do not delete that
  block as redundant.** Without it the job inherits read-only, every
  `gh pr comment` fails with a 403, and it reads as a logic bug in a workflow
  nobody is watching.
- Both workflow files are in. `claim-check.mjs` runs in the health check, so the
  register is enforced on CMS pull requests rather than only on one laptop.
  `cms-draft-notice.yml` comments on both pull requests when two CMS drafts
  touch the same file.
- The `compat_outcomes.testing.title` defect is fixed.
- `conditions.label` became "Likely compatible", so the badge agrees with the
  heading Alrik published through the CMS on 19 Aug. Both are registered and
  **still open**: aligning the badge closed the contradiction on the screen but
  spread the warmer wording rather than retiring it, and the thresholds did not
  move. Only one of the four decisions closes those entries.
- Two mobile navigation faults, both reported as device-specific and neither
  actually being so. The burger icon had no `color` declared anywhere except on
  the home hero, so `stroke="currentColor"` fell through to the browser's own
  default for button text — near-black in Chrome and Brave, system blue in iOS
  Safari. The "Request Assessment" button lost a specificity contest between two
  `!important` colour declarations and rendered dark navy on sage at 3.25:1,
  under the 4.5:1 WCAG AA wants.
- The nav `!important` rules were audited afterwards, because both faults came
  out of that one block. No dead rules; four collisions, three left alone and
  one settled by scoping. **The map is written as a comment above `.nav-links`
  in `src/assets/css/styles.css`** — read it before adding any rule that touches
  `.nav-links a`, and note the warning there about `.nav-cta` carrying 21 of the
  73 declarations at the lowest specificity in the section.

### The quiz, if you are working on it

- Scoring data: `src/_data/assess.yml`. Verdict logic: `verdict()` in
  `src/assets/js/main.js`. Categories, formats and `catFormMap` are hardcoded in
  `main.js` and are **not** CMS-editable.
- `scripts/assess-matrix.mjs` lifts `verdict()` out of `main.js` as source text
  and runs it against `assess.yml` to produce the full answer key. Nothing is
  re-implemented, so it cannot drift. **If you refactor the quiz, the
  regenerated CSV must be identical row for row, or you changed behaviour.**
- pH bands are verbatim from Compatibility Guide v1.2 §3.1. The 60°C threshold
  is §3.4. The format risk scores have no cited source and say so in the
  register. Do not move any of them without a decision on record.

## Conventions

- Comments in code and templates explain *why*, at length, including what was
  tried and rejected. Match that. A comment that only restates the line is noise.
- Content lives in `src/_data/*.yml` and is edited by non-technical people. Any
  new field needs a matching entry in `src/admin/config.yml` with a plain
  English `label` and a `hint` written for someone who has never seen the repo.
  No bare field names like `jobtitle` in a label.
- Scripts under `scripts/` fail loudly, name the offending row, and say what to
  do about it. See `scripts/claim-check.mjs` for the house style.
- Do not add a dependency without a reason. The site has one: `js-yaml`.

### Grouping a CMS panel into sections

`src/_data/home.yml` is nested into eight objects — `hero`, `challenge`,
`value_prop`, `how_it_works`, `industries`, `partners`, `insights`,
`final_cta` — and `config.yml` renders each as a collapsed `object` widget
labelled with its position on the page, "1. Hero" through "8. Closing call to
action".

It was forty-one fields in one flat list until 20 Aug. Decap has no way to group
flat fields: the panel had been faking it with prefixes typed into each label
("Challenge:", "Value Prop:"), and the hero's fourteen fields carried no prefix
at all, so the panel opened on fourteen boxes with nothing to say which part of
the page they controlled. Nesting the data is the only real fix.

**Every other page collection was regrouped the same way on 20 Aug**, in panel
order and numbered to match the page: about (34 fields into 9 sections), the
three solution pages, industries, use-cases, careers, FAQ, contact, and the
quiz. The quiz panel is the one worth knowing about — its eight sections
separate wording from scoring, and section 7 says outright that editing it
changes which result a visitor is given.

Two files were deliberately left flat. `site.yml` is settings rather than page
sections, a flat list of sixteen reads fine, and it is referenced 63 times
across 13 templates including `structured-data.njk`, so the risk is real and
the gain is not. `team.json` is a list of people, not a page.

Three things make it safe to repeat:

- Transform the YAML as *text*, never by loading and re-dumping it. `home.yml`
  carries 80 comment lines, including Kirsty's sign-off condition on the
  positioning line and why `hero.claims_coda` is deliberately empty.
  `js-yaml` round-tripping deletes all of them, which is the failure this file
  already records happening twice.
- Snapshot `_site` before and `diff -r` after. A pure regrouping must leave
  every rendered page byte-identical; only `_site/admin/config.yml` may differ.
  That is what proves no template reference was missed.
- Run `node scripts/cms-audit.mjs` — not part of `npm run check`, only CI. It
  walks nested fields and is what catches a config name that no longer matches
  its data key.

To see the panel without logging in: add `local_backend: true` to
`_site/admin/config.yml` (the build output, never the source), run
`npx decap-server`, and log in at `/admin/`. The local backend writes to real
files, so look and do not save. Decap reads the config once at boot, so a hash
change does not pick up an edit — reload the page.

### Three ways a regrouping breaks quietly

All three were hit on 20 Aug. None of them errors in a way that points at the
cause, and two of them do not error at all.

- **Nunjucks keywords cannot be property names.** `no_openings` was renamed to
  `none`, and `careers.openings.none` parses as a lookup with no name. The build
  dies with "expected name as lookup value, got none" at a line number offset by
  the front matter, so it points several lines away from the real one. `null`,
  `true` and `false` will do the same.
- **A dotted prefix is not a global.** `home.njk` contains
  `home.industries.label`, because the Home entry has its own industries section
  *and* there is a global called `industries`. A rename that matches on the
  identifier before the dot will rewrite the inner one. Nothing errors: Nunjucks
  resolves the missing property to an empty string, and the home page silently
  rendered an empty section label and heading.
- **A failed build leaves the last good `_site` in place.** `diff -r` then
  reports no differences, which reads as "nothing broke" when it means "nothing
  ran". Check that the build actually wrote its files before trusting the diff.

### The claim register uses dotted field paths

`field:` in `docs/claim-review.yml` is now a path — `choose.groups`,
`result.outcomes` — because the data files are nested. `scripts/claim-check.mjs`
walks it and names the segment that failed.

It also checks `field:` on entries that carry a `phrase:`, which it did not
before: the check was an `else if`, so an entry with both only ever had its
phrase looked at. Four entries had been pointing at keys that have never
existed — `detect-coa-wording` and `detect-standards` named `capabilities`,
`tag-robust-stability` and `tag-facility` named `benefits` — and nothing could
have told you. All four now point at `features.items`.

## Where decisions are written down

Records live in the attached claude.ai project, not in the repo. The ones that
matter for the quiz work:

- `assess-quiz-outcome-audit-2026-08-19.md` — the 83% finding and the four open
  decisions
- `assess-cms-editability-scope-2026-08-19.md` — the phased refactor
- `cms-concurrent-editing-2026-08-19.md` — the collision workflow and the
  working agreement
- `rollback-v1.md` (in `docs/`) — DNS, Pages and the domain cutover
- `rollback-v2.md` (in `docs/`) — the quiz copy change and the CI claim gate,
  the versions everything was pinned at, and the checks to run after a revert
- `content-decisions.md` (in `docs/`) — why the words in `src/_data/*.yml` say
  what they say: who asked, when, and what was rejected. Covers home.yml today.
  Read it before changing hero or challenge copy; it carries the one constraint
  that spans two fields ("counterfeit" appears in the hero claims and in the
  fourth value card, and the two have to move together)
- `brand-standard.md` (in `docs/`) — the **company-wide** colour and type
  standard, not a website document: it governs decks, PDF reports, Excel,
  charts and the app interfaces as well. It lives here because this is the one
  surface where the palette is enforced in code rather than by convention, and
  the tokens in `styles.css` are where its figures were verified. Read it
  before adding a colour anywhere. Two things it settles that are easy to get
  wrong: a brand colour and a text colour are not the same object (which is why
  `--sage-ink` and `--gold-ink` exist), and gold is directional — `--gold-light`
  is text on dark only, `--gold-ink` on light only, and swapping them passes a
  screenshot audit
