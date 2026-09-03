# Insights topics

For Kirsty and Alrik. Written 2 September 2026.

The fixed list of topics an Insights article can carry, why these six, and what
to do when a seventh is needed.

## The six

| Topic | Articles | What belongs in it |
| --- | --- | --- |
| Company News | 7 | Anything about Natural Trace as a company: appointments, structure, awards, the introduction to this section |
| Industry Events | 4 | Conferences and trade shows we attended or exhibited at, and what was said there |
| Science & Evidence | 4 | Trials, results, and how the technology works |
| Food Fraud | 2 | Fraud, counterfeits, recalls, adulteration — the problem rather than our answer to it |
| Ingredient Authenticity | 2 | Verifying a specific branded ingredient is what it claims to be |
| Regulation | 1 | Rules, standards and compliance driving traceability |

Regulation holds one article and that is fine. It is a category rather than a
keyword: the next regulatory piece has somewhere to go. That distinction is the
whole point of this list, and it is the thing that went wrong before.

## Why six, and why a fixed list

Before this there were seventeen tags across twenty articles and fifteen of
them were on exactly one article. Two problems, and only one of them was
visible:

- **"News" was on twelve of twenty**, including awards, a strawberry trial, a
  regulatory piece and two conference write-ups. A tag that is on most things
  is not a tag, and filtering by it narrowed almost nothing.
- **Thirteen tags existed only to describe two articles.** The Growth Asia Day
  1 and Day 2 write-ups carried five and eight tags each — Berry Bioactives,
  GLP-1 Companion Products, Protein Innovation and so on. Those are keywords
  someone typed while writing, not categories the archive is organised by.

The fix is not to tidy the list. Tidying it once and leaving the field as free
text means the next article adds "Nutraceutical Authentication" beside the
existing "Nutraceuticals", which is a collision that was already live, and
nobody notices a taxonomy rotting.

So the CMS field is a fixed list now. In `/admin/`, Tags is a set of
checkboxes rather than a box to type in. **Adding an article can no longer add
a topic.**

## When six is not enough

It will not be enough forever, and that is expected. Adding one is deliberate
rather than accidental, which is the entire design:

1. Agree the topic is a category and not a keyword. The test: will a second
   article plausibly carry it within a year? "Regulation" passes on one
   article. "Berry Bioactives" does not.
2. Ask whoever looks after the website to add it to `options` in
   `src/admin/config.yml` and to the table above.

That is a two-line change and takes a minute. The friction is the feature.

**Do not remove a topic that articles still carry.** Decap will not show a
stored value that is missing from `options`, and the next person to save that
article silently drops its topic. Re-tag the articles first, then remove it.

## Where a topic shows up

Changing an article's topic changes four things at once:

- The kicker above its headline on `/insights/`, in gold.
- Which option of the Topic control lists it, and that option's count. Since
  3 September 2026 the control navigates to the topic's archive rather than
  filtering the index, because the index is paginated.
- Which tag archive it appears on. Every topic has one (`TAG_PAGE_MIN` in
  `.eleventy.js` is 1 since 3 September, the note there says why), so a
  topic with a single article has a one-article archive rather than none.
- The `/insights/tag/…/` address of that archive, if it is the first or last
  article to carry the topic.

## What the old tags became

The seventeen, and where each went. Kept so that an old tag seen in a draft,
an export or a search result can be traced.

| Old tag | Became |
| --- | --- |
| News (12) | Split. It was a catch-all with no single successor: its articles went to Company News, Industry Events, Science & Evidence, Food Fraud, Ingredient Authenticity and Regulation according to what they are about |
| Press Release (3) | Company News |
| Company News (1) | Company News |
| Industry Events (1) | Industry Events |
| Research Blog (1) | Ingredient Authenticity |
| Supply Chain Transparency, Food Authentication, Nutraceuticals, Clean Label | Industry Events — all four were on the Growth Asia Day 1 write-up |
| Active Lifestyle Nutrition, Weight Management, Protein Innovation, Nutraceutical Authentication, Functional Foods, GLP-1 Companion Products, Berry Bioactives, Ingredient Verification | Industry Events — all eight were on the Growth Asia Day 2 write-up |

The SupplySide Global 2025 article had no tags at all and now carries Industry
Events. Its row on the index had no kicker, which looked like a rendering fault
and was missing data.

`/insights/tag/news/` and `/insights/tag/press-release/` were real, indexable
pages and no longer exist. Both redirect: news to the index, because it had no
successor, and press-release to the Company News filter, because it does.
