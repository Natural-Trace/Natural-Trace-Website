# Savepoint v2 — 19 August 2026

Everything needed to put the site back to the state it was in immediately
before the compatibility quiz copy change and the CI claim gate.

Unlike `v1` this is a git-only savepoint. No DNS, no Pages setting and no
Cloudflare configuration was touched, so `docs/rollback-v1.md` remains the
record for anything at that level and nothing in it is superseded.

---

## 1. Git

| What | Value |
| --- | --- |
| Tag | `v2` |
| Commit | `2247d8c` — "Register the new compatibility quiz outcome heading for review" |
| Branch | `main`, working tree clean apart from the untracked generated answer key |
| `origin/main` at the savepoint | `2247d8c` |
| `origin/main` after the batch | `2813243` |
| `origin/gh-pages` after the batch | `da3229a` |

### What landed on top

Five commits, oldest first. They are listed separately because they are
independently revertible and you will almost never want to undo all five.

| Commit | What it does | Safe to revert alone |
| --- | --- | --- |
| `d6876b9` | Runs `claim-check.mjs` in the health check; adds the CMS collision workflow | Yes |
| `1eaf8a6` | Tracks `CLAUDE.md` | Yes |
| `16bcc84` | Both `/assess/` headings, the badge rename, and the register entries | Yes — see below |
| `e7f7acc` | Completes the collision workflow: comments on both pull requests | Yes |
| `2813243` | Drops a stale claim count from a comment | Yes |

### Getting back

Preferred, because it does not rewrite anything anyone else has pulled:

```
git revert <sha>
git push
```

To undo the whole batch, revert newest first so each revert applies cleanly:

```
git revert 2813243 e7f7acc 16bcc84 1eaf8a6 d6876b9
git push
```

Only if history really has to go back, and only after telling anyone who has
cloned the repository:

```
git checkout main
git reset --hard v2
git push --force-with-lease origin main
```

To read the savepoint without changing anything:

```
git switch --detach v2
```

---

## 2. The one revert with an ordering constraint

`16bcc84` changes published wording **and** the claim register entries that
describe it, deliberately in a single commit. `claim-check.mjs` compares the
register against the source files on every build, so a commit that moves one
without the other fails its own check.

This means `git revert 16bcc84` is safe and complete: the wording and the
register go back together and the build stays green.

It also means **do not revert it by hand, file by file.** Reverting
`src/_data/assess.yml` alone leaves `assess-outcome-conditions-badge` in the
register with `phrase: 'Likely compatible'` and no such phrase in the source,
and the health check will fail on `main` with the register and the site
disagreeing. That is the check working correctly; the fix is to revert the
whole commit rather than to edit the register to match.

What reverting `16bcc84` restores:

| Field | Back to |
| --- | --- |
| `compat_outcomes.testing.title` | "Let's dive and understand your product more" (the missing word returns) |
| `compat_outcomes.conditions.label` | "Compatible with conditions" |
| `src/admin/config.yml` panel heading | "Compatible with conditions" |
| `scripts/assess-matrix.template.html` rule text | "Compatible with conditions" |
| `docs/claim-review.yml` | 23 entries, `assess-outcome-conditions-badge` removed |

`compat_outcomes.conditions.title` is **not** affected. "Sounds like you are
compatible" was published by Alrik through the CMS in `14712d2`, before this
batch, and is on the far side of this savepoint. Reverting to `v2` does not
take it back.

---

## 3. Versions at the savepoint

Recorded so a rebuild from this tag produces the same site rather than
whatever the registries are serving on the day.

| Component | Version | Where it is pinned |
| --- | --- | --- |
| Eleventy | 3.1.6 installed, `^3.1.6` declared | `package.json` |
| js-yaml | `^4.1.0` | `package.json` |
| Decap CMS | 3.15.1, exact | `src/admin/index.html` |
| `actions/checkout` | v6 | both workflows |
| `actions/setup-node` | v6 | both workflows |
| Node in CI | 20 | both workflows |

Two things worth knowing before trusting a local build:

- **Node is 24.19.0 locally and 20 in CI.** Everything here runs on both today,
  but a local `npm run check` is not proof about the runner. The `^` on Eleventy
  means a local `npm install` can also pull a newer 3.x than the one that built
  the live site.
- **Decap is pinned exactly on purpose.** It used to load `^3.0.0`, which meant
  whatever unpkg was serving that morning, in the browser of whoever opened the
  CMS. The note above the tag in `src/admin/index.html` has the history.

---

## 4. Checks to run after any revert

In order. Each one catches something the previous one cannot.

```
npm run check
```

Must end with `all checks passed` and `register and site agree`. The second
line is the one that matters after a copy revert: it is what proves the
register and the published wording went back together.

```
node scripts/assess-matrix.mjs
```

Regenerates `docs/assess-matrix.html`. The file is not tracked, so this is
never a source of conflict, but the counts it prints are the fastest check that
quiz behaviour is unchanged. At this savepoint they are:

```
1088 combinations: compatible 63, conditions 124, testing 901
```

Any different figure means a revert reached the scoring rather than only the
words, and should be backed out and looked at.

Finally, before pushing anything:

```
git ls-remote --heads origin 'refs/heads/cms/*'
```

Empty output means no CMS draft is open. **A revert pushed while someone has a
draft open against the same file will be silently undone when they publish**,
because Decap writes the whole file back from what their browser loaded. This
is the failure the collision workflow added in `e7f7acc` exists to warn about,
and it applies to a rollback exactly as it applies to an edit.

---

## 5. What this savepoint does not cover

- **`origin/gh-pages`.** It is build output and is force-pushed on every deploy.
  Reverting `main` and letting the workflow run is the way to put it back;
  there is no reason to touch the branch directly.
- **`docs/assess-matrix.html`.** Generated, untracked, and regenerated by the
  command in section 4. Nothing links to it.
- **Anything a CMS editor changes after this point.** Those arrive as ordinary
  commits on top and are reverted as ordinary commits.
- **The Cloudflare Worker, HubSpot, and DNS.** Unchanged by this batch. See
  `docs/rollback-v1.md`.

---

## 6. Open at the time of the savepoint

- **The four quiz decisions with Alrik and Ying Xiang are still open.** The
  quiz is 83% "Testing required" and 6% "Compatible" across all 1,088
  combinations. No band has been moved and none should be until one of those
  decisions closes.
- **`assess-outcome-conditions-title` is open in the register.** The heading
  "Sounds like you are compatible" describes a medium-risk result more warmly
  than the scoring justifies. Aligning the badge to it in `16bcc84` closed the
  contradiction on the screen but spread the wording rather than retiring it.
  Only a threshold decision closes this entry.
- **`assess-outcome-conditions-badge` is open in the register**, for the same
  reason and with the same owner.
- **`src/admin/config.yml` line 880** still offers "Compatible with conditions"
  as an outcome on `compat_evidence`. That records the result of a lab test and
  is a different thing from the quiz badge, so it was deliberately left alone.
  The two now read differently in the CMS and a future decision may want to
  reconcile them.
