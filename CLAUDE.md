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

### Outstanding, in priority order

1. **Two workflow files need adding** (Bryan, by hand):
   - the `claim-check.mjs` step in `.github/workflows/healthcheck.yml`
   - `.github/workflows/cms-draft-notice.yml`, which warns when two CMS drafts
     touch the same file
2. **Live copy defect.** `compat_outcomes.testing.title` reads "Let's dive and
   understand your product more". Missing a word. It is the heading 83% of quiz
   visitors see. One-line fix, can be done in the CMS.
3. **The compatibility quiz is 83% "Testing required"** across all 1,088
   possible answer combinations, and only 6% "Compatible". Four decisions are
   open with Alrik and Ying Xiang before anything is changed. Do not adjust a
   band without one of those closing.
4. **CMS editability refactor**, blocked on those four decisions.

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

## Where decisions are written down

Records live in the attached claude.ai project, not in the repo. The ones that
matter for the quiz work:

- `assess-quiz-outcome-audit-2026-08-19.md` — the 83% finding and the four open
  decisions
- `assess-cms-editability-scope-2026-08-19.md` — the phased refactor
- `cms-concurrent-editing-2026-08-19.md` — the collision workflow and the
  working agreement
- `rollback-v1.md` (in `docs/`) — DNS and rollback
