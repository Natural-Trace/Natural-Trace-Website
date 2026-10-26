# Website status log

Moved out of `CLAUDE.md` on 26 Oct 2026 so dated status does not load into every session.
Durable rules from this log stay in `CLAUDE.md`. Add new entries at the top.

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
