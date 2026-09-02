# Content decisions

Why the words in `src/_data/*.yml` say what they say: who asked, when, and what
was rejected. One entry per decision that someone would otherwise undo by
accident.

## Why this file exists

The same reason `docs/claim-review.yml` exists. Decap does not edit YAML in
place — it parses a file into data and writes the whole thing back out, and a
comment is not data. Every comment in a file named in a collection in
`src/admin/config.yml` is deleted the first time anyone saves that file through
the CMS.

That has already happened twice: `src/_data/site.yml` on 18 Aug 2026, 76 comment
lines, and `src/_data/assess.yml` on 19 Aug, 114 lines including every
`CLAIM REVIEW` marker.

`src/_data/home.yml` was next and was the largest of the three, at 80 lines. It
survived only because nobody had happened to save the Home entry yet. On
20 Aug the Home panel was regrouped into eight labelled sections, which makes it
markedly easier to edit — and therefore makes the save that would have deleted
all 80 lines markedly more likely. So they were moved here first.

Nothing under `docs/` is reachable from the CMS, because the CMS can only touch
files named in a collection in `src/admin/config.yml`.

## What goes here, and what does not

| Kind of note | Where it belongs |
| --- | --- |
| Guidance an editor needs while typing | `hint:` on the field in `src/admin/config.yml` |
| Why the wording is what it is, who asked, what was rejected | here |
| A published phrase that has not been signed off | `docs/claim-review.yml` |
| How the template renders it | a comment in the template, which Decap cannot reach |

The split matters. A hint is read at the moment of editing and has to be short.
This file is read when someone asks "can I change this?" and is allowed to be
long. Neither replaces the claim register, which is enforced on every build;
this file is not enforced by anything, so keep it accurate by hand.

To add another data file, add a `## src/_data/<file>.yml` heading and follow the
same shape. Field paths are written as they appear in the file after the
20 Aug nesting, for example `hero.slogan`.

---

## src/_data/home.yml

### Constraint that spans two fields

**"Counterfeit" appears in `hero.claims` and in the fourth card of
`value_prop.cards`. The two move together.** The word was "suspicious" in both
places until 14 Aug. "Counterfeit" is the stronger claim and was deliberately
left alone until someone owned it; Alex Bond, Director of Business Development
US, asked for it on 13 Aug. Changing one without the other leaves the page
arguing with itself, and nothing in the build will tell you.

### `hero.slogan` — the positioning line

Verbatim from the Clean Prototype Copy Guide 2026. **Do not shorten it without
Kirsty's sign-off.** Rendered in bold at the start of the hero lead paragraph,
directly under the headline.

*"and Products"* was added on 18 Aug at Alex Bond's request. His argument was
that the line as written read as ingredients-only, which loses anyone whose
concern is a finished product rather than an input.

The ampersand is written `&amp;` with `&nbsp;` either side, and the same applies
to the "Why Customers Choose" card headings. An ampersand joins two things and
must not be left at the end of a line holding one of them. Without the binding
the line broke as "…for Food & / Nutraceutical Ingredients." on a phone. The
words are unchanged — `&amp;` is only how a bare `&` is written once the field
goes through the `safe` filter. The non-breaking space also stops "and Products"
wrapping alone onto its own line.

### `hero.claims` — the ticked list

Kirsty wrote these as five short lines. The fifth was a coda rather than a peer,
which is why it read as an orphan when all five were set as a list; it became
`hero.claims_coda` and the list became four.

They render as a ticked list rather than one running sentence, so each one
starts with a capital. They were previously joined into a single sentence with
commas and "and".

See the cross-field constraint above before touching the fourth one.

### `hero.claims_coda` — empty on purpose

Emptied on Kirsty's request, 12 Aug. It used to trail the four ticks as
"...all through the supply chain", saying the same thing that `hero.desc` above
it now says in a full sentence.

The template only renders the line when the field has a value, so an empty
string removes it cleanly. It can be brought back from the CMS panel with no
code change — which is why the field still exists rather than having been
deleted.

### `challenge.points` — three beats

Kirsty asked for shorter wording and sent a layout for it on 12 Aug. The section
used to carry a lead paragraph, a labelled list of six statements and a closing
sentence, all saying the same thing at three different lengths: the lead said
documentation can be copied and testing can be inconclusive, the list said
supply chains are complex, the close said Natural Trace puts the proof in the
product. Those three points are what remains. Three beats, not six bullets and
two paragraphs.

The third point is the turn the whole section exists to make, so it is marked
with `emphasis` and reads as a question rather than a statement. **Only one
point should ever carry emphasis — two is the same as none.**

### `value_prop.cards` — the photographs

The five card photographs are Kirsty's, uploaded 13 Aug. They are 16:9, and the
card crops them to a shallower band at her request, so the picture reads as a
strip across the top rather than taking a third of the card.

### `how_it_works` — why it is on the home page

Moved here from the NaturalTag page on 8 Aug, after Kirsty flagged that Section
4 of the approved copy was missing from the homepage and that this was it. Since
12 Aug it renders in **both** places from this one set of fields, so an edit here
changes the home page and `/naturaltag/` together.

The four steps sit on one row and the detail below is a disclosure, so the
section costs about one screen rather than four. It is a `<details>` element and
deliberately not a hover: hover does not exist on a phone and cannot be reached
from a keyboard.

### `how_it_works.title`

Inverted on 18 Aug at Alex Wild's suggestion. It previously read "Four Steps
From Ingredient to Evidence", which leads with the count — the least interesting
part. The current wording leads with the outcome and keeps the count as the
reassurance that it is short.

### `partners.logos` — adding one

Drop the logo file into `src/assets/partners/` and add a `url` / `image` / `alt`
block. See the README in that folder. The rail scrolls and holds as many as you
add, but below about six it can show the same logo twice at both ends, so tell a
developer if the list ever gets that short.

### `insights` — nothing to maintain

The three most recent dated articles are pulled in automatically. Publishing an
article updates the strip. The only editable copy is the heading and the link
text.

---

## src/_data/faq.yml

### The complex-matrices answer names the matrices

Bryan asked on 2 Sep 2026 for the answer to "Can it be used in complex
matrices, such as oils, powders, and liquids?" to give examples that have
worked and to send the reader to a compatibility assessment. It had been one
line: "NaturalTag™ has been validated across multiple matrices."

The examples are taken from the "Food Matrices Validated" list on the
NaturalTag page and nowhere else, so the FAQ names nothing the site does not
already publish. That list has never been through claim review, so the new
answer is registered in `docs/claim-review.yml` as `faq-matrices-examples`,
owner Alrik. **Do not add a matrix here that is not on the NaturalTag list.**
Gummies stay off both, for the reason recorded under the industry pages below.

The call to action is the `link_text` / `link_url` pair on the question, an
optional field any answer can now use. The answer text is written to be
complete without it, because the same text is emitted as FAQPage structured
data for search engines, and that carries no link. Alex Wild's note on the
Copy Guide FAQ was that the answer to this kind of question is almost always
yes and should link to the compatibility assessment button, which is what this
does.

---

## The four industry pages: src/_data/nutraceuticals.yml, brandedingredients.yml, functionalfoods.yml, agrifood.yml

Added 2 Sep 2026. One data file per page, one shared template
(`src/_includes/pages/industry.njk`), four thin pages under `src/pages/`. The
four files carry the same field paths, so everything below applies to all of
them unless a file is named.

### Status: drafted, not signed off

**Nothing in these four files has been approved by Kirsty.** The Copy Guide
("Natural Trace Website Copy Guide 2026", Kirsty and Alex Wild, the source of
truth for site copy) gives each industry one line. The pages needed more, and
the decision on 2 Sep was to assemble them from wording that is already in the
Copy Guide rather than write anything new, then put the result in front of
Kirsty on a pull request. The pull request is the review; the branch does not
merge until she has read it. Alrik is asked to confirm the `formats` lists.

If you are editing these files before that sign-off has happened, you are
editing a draft, and the draft is deliberately conservative. Do not strengthen
anything.

### `hero.tagline` — the one approved line

Verbatim from the Copy Guide's Industries section. Alex Wild's standing
condition (29 Jul 2026) is that once a tagline or value proposition is settled
it is frozen, with no freedom to vary it. The same four lines are the card
descriptions in `industries.yml`. Change them in the Copy Guide first, then in
both places together.

### Where every other line came from

- `hero.intro`: Section 2 "The Challenge" (nutraceuticals); the About page's
  "Branded Ingredient Differentiation" (branded ingredients); the About page's
  "Downstream Verification" (functional foods, first sentence) and "Why We
  Exist" (agri-food, first three sentences).
- `challenge.items`: "Why authentication matters today" (Section 2), the
  "Customer problem" column of Alex Wild's five-use-case table, and the About
  page's "Our Story".
- `value.items`: the "Natural Trace value" column of the same table, the
  Section 3 value pillars, NaturalTag's "Why NaturalTag" list, the How It Works
  bullets, and the About page's "What Makes Us Different".
- `formats.items`: the "Food Matrices Validated" list on the NaturalTag page,
  split by sector.
- `final_cta`: the homepage's final call to action, verbatim.

**Three lines are not in the Copy Guide** and are the first things for Kirsty
to look at:

- `functionalfoods.yml` `hero.intro`, second sentence ("Natural Trace gives
  every ingredient a unique, detectable identity, so the branded ingredient
  behind a functional claim can be verified in the finished product"). Built
  from the hero supporting copy and the Functional Foods one-liner.
- `agrifood.yml` `hero.intro`, last sentence ("Tagged at pre-harvest treatment
  or before export…"). A summary of the two agri-food use cases.
- `agrifood.yml` `value.items`, third point ("Authenticate samples collected
  overseas…"). The green coffee use case, rephrased as a capability.

### What is deliberately absent

- **Gummies.** Removed from the Copy Guide on 29 Jul 2026 pending confirmation
  that the tag survives gummy processing. Alrik's position in that thread:
  anything beyond boiling point is not a good fit. So `nutraceuticals.yml`
  lists Powders, Capsules, Tablets, Sachets, Liquids, Drops and stops there.
- **Anything baked, cooked or retorted** in `functionalfoods.yml` `formats`,
  for the same reason. The list is functional foods, beverages and the powder,
  sachet, liquid and drop formats. Do not add bakery, snack bars or
  ready meals without Alrik.
- **Claims that are registered on other pages.** "Validated across 20+
  matrices", the facility certifications, GRAS status and "survives supply
  chain handling" all live in `docs/claim-review.yml` against the pages they
  are on. They are not repeated here, so the industry pages add nothing to any
  open claim's footprint. `npm run check:claims -- --published` is the check.

### `use_cases.sectors`

A list of `sector` strings from `usecases.yml`, matched exactly. The cases
render from that one file through `partials/usecase.njk`; nothing about a case
is copied into an industry file. `functionalfoods.yml` has an empty list
because no functional-foods case exists yet, and the template leaves the band
out rather than print a heading over nothing. When a case is written, add its
sector string here and it appears.

### Spelling

The Copy Guide mixes "authorized" (Alex Wild's table) with "authorised"
(everything else). The site is British throughout, so the table's lines were
normalised on the way in.

### The hyphen in "agri‑food" is a non-breaking hyphen

In `agrifood.yml` `hero.tagline`, the Agri-food card description in
`industries.yml`, and the Agri-food tile in `home.yml`, the hyphen in
"agri‑food" is U+2011, the non-breaking hyphen, not the ordinary one. Bryan
asked on 2 Sep 2026 for the word to stay on one line after the tagline broke
as "agri-" / "food" at desktop width. Browsers treat an ordinary hyphen as a
place they may break; U+2011 looks identical and is not.

If the word is retyped in the CMS it comes back as an ordinary hyphen and the
split returns, with nothing in the build to say so. Copy the word from one of
the three fields rather than typing it. Page titles and menu labels are left
with the ordinary hyphen: they are short enough never to break there.

### No comments in these files

They are named in `src/admin/config.yml`, so Decap will delete any comment the
first time an editor saves one. This section is where the reasons live.
