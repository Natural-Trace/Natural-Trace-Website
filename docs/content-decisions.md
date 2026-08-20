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
