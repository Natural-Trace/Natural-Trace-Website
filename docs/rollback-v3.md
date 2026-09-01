# Savepoint v3 — 1 September 2026

Everything needed to put the Insights section back to the state it was in
immediately before the CNA-style rebuild.

A git-only savepoint, like `v2`. No DNS, no Pages setting and no Cloudflare
configuration was touched, so `docs/rollback-v1.md` remains the record for
anything at that level and nothing in it is superseded.

---

## 1. Git

| What | Value |
| --- | --- |
| Tag | `v3` |
| Commit | `6e442a8` — "Serve the Growth Asia photograph from the site" |
| Branch | `main`, working tree clean |
| `origin/main` at the savepoint | `6e442a8` |

### The state `v3` holds

- Insights index as stacked cards, nine per page across three pages, with a
  numbered pager.
- The newest article on page one as a sideways lead card.
- Summaries shown on the index and on the tag archives.
- Card images cropped to `aspect-ratio: 1.91`.
- Every image served from this site; no `pbs.twimg.com` hotlink.

### What landed on top

| Commit | What it does | Safe to revert alone |
| --- | --- | --- |
| `f031aca` | The whole rebuild: rows, one page, no summaries, no pager, shared row partial, tag archives, date filter | Yes |

One commit on purpose. The template, the partial, the tag archives and the CSS
are a single change: reverting the CSS alone leaves markup with no rules, and
reverting the template alone leaves the tag pages including a partial the index
no longer uses.

### Getting back

Preferred, because it does not rewrite anything anyone else has pulled:

```
git revert f031aca
git push
```

Only if history really has to go back, and only after telling anyone who has
cloned the repository:

```
git checkout main
git reset --hard v3
git push --force-with-lease origin main
```

To read the savepoint without changing anything:

```
git switch --detach v3
```

---

## 2. What a revert brings back, and what it does not

Reverting `f031aca` restores the cards, the pager, the lead card, the summaries
on both the index and the tag archives, and the `%B %d, %Y` date on the index.

Two things it does **not** undo, both deliberate and both harmless to leave:

- **The redirect rules for `/insights/page/2/` and `/3/`** stay in
  `src/_data/redirects.yml`. If the pager comes back, those two URLs become real
  pages again, and a rule with the same `from` as a real page is a conflict:
  the redirect stub and the paginated page both want to write
  `_site/insights/page/2/index.html`. **Delete those two rules in the same
  commit that restores pagination.** They are at the end of the file under a
  comment naming this date.
- **The `date` filter throwing on an unknown format.** This is independent of
  the layout and worth keeping either way. Reverting the layout does not remove
  it, and nothing in the card markup uses a format it does not know.

---

## 3. Partial rollbacks

The likeliest outcome is not "put it all back" but "put the summaries back",
because that is the one part of this that is a content decision rather than a
layout one.

**Summaries only, keeping the rows.** Add to
`src/_includes/partials/insight-row.njk`, inside `.insight-row-text` after the
`h2`:

```njk
{% if post.data.summary %}<p class="insight-row-summary">{{ post.data.summary }}</p>{% endif %}
```

and to `src/assets/css/styles.css`, beside the other `.insight-row` rules:

```css
.insight-row-summary{font-size:.84rem;line-height:1.6;color:var(--muted);margin:.15rem 0 .4rem;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
```

Two lines, clamped, because the summaries carried over from WordPress are the
opening of the article rather than a written summary and run to 380 characters.
Expect the row pitch to go from 147px to roughly 190px and the page from
3,587px to about 4,400px, which is still well under one paginated page of the
old layout.

**The pager, if the archive grows.** Judged worth revisiting at about fifty
articles. Restoring it is putting the `pagination` block back in the front
matter of `src/pages/insights.njk`, restoring the `permalink` expression, and
deleting the two redirect rules named above. The pager markup and CSS are in
`f031aca`'s diff.

---

## 4. Checks after any revert

```
npm run check
```

Then confirm by hand, because none of these fail a build:

| Check | Expected |
| --- | --- |
| `/insights/` | Renders, and the newest article is at the top |
| `/insights/page/2/` | A real page if the pager is back; a redirect to `/insights/` if not — never both |
| `/insights/tag/news/` and `/insights/tag/press-release/` | Same row or card treatment as the index, not a mixture |
| Article pages | Unaffected either way; they never used this markup |
| `/feed.xml` | Newest item first, unchanged by any of this |
| Home page | Unaffected; it has its own `.home-insights-list` markup and always did |

The last two are the ones most likely to be skipped and least likely to be
noticed. The feed is what the Zapier flow in `docs/publishing-to-linkedin.md`
reads, and the home page shares the word "insights" with this section without
sharing any of its code.
