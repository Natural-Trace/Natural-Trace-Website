# Colour and type standard

The palette and type scale the website actually ships, read back out of
`src/assets/css/styles.css` and re-verified rather than transcribed from a
slide. Every ratio below was recomputed from the hex values; none is quoted
on trust.

Drawn 4 September 2026 from commit `edbd4c1`. Contrast is WCAG 2.1 AA:
4.5:1 for body text, 3:1 for large text and non-text, 7:1 for AAA.

## Why this file exists

There was no written colour standard. There is a five-colour list in the
company `CLAUDE.md` and a folder of logos under `Brand/`, and between them
sat the actual system — seventeen tokens in a stylesheet, several of which
exist purely to stop a brand colour being used where it fails.

That gap is how a designer picks Harvest Gold for body copy in good faith.
It measures 3.09:1 on white. Nothing in the five-colour list says so.

Nothing under `docs/` is reachable from the CMS, so this file is safe from
the Decap rewrite that has already deleted comments from four data files.

## The rule everything else follows

**A brand colour and a text colour are not the same object.**

Five colours identify Natural Trace. Only some of them can legally hold a
sentence. The stylesheet resolves this by carrying both — a *surface*
colour for fills, and a measured *ink* partner for type — and that is the
entire reason the deployed palette has seventeen tokens rather than five.

Harvest Gold at `#A29349` is 3.09:1 on white, below the 4.5:1 floor, so
gold is a fill, a rule, a numeral plate, never a paragraph. Sage Olive
clears white at 5.09:1 but falls to 4.68:1 on the off-white cards and
3.81:1 on Soft Sage Grey. Each of those is a real surface on the live
site, which is why every ratio here is quoted per ground and not as one
headline number.

## Core identity colours

| Colour | Token | Hex | Role | On white |
|---|---|---|---|---|
| Sage Olive | `--sage` | `#6B7249` | Primary. Buttons, active states, section rules, affirmative status | 5.09 |
| Harvest Gold | `--gold` | `#A29349` | Accent only. Underlines, numerals, eyebrows on dark, headline gradient | **3.09 fails** |
| Deep Teal | `--teal` | `#3B666B` | Technical and analytical emphasis. Secondary links, tags, chips | 6.37 |
| Soft Sage Grey | `--soft-sage` | `#DEDFDE` | Dividers, hairlines, inactive tracks | **1.34 fails** |
| Pure White | `#fff` | `#FFFFFF` | Card and panel ground | — |

Sage Olive is the most-referenced colour in the stylesheet and is the only
one used for a primary call to action.

Deep Teal is the only chromatic brand colour that passes as text on every
ground the site uses, unmodified. It needs no ink partner.

Soft Sage Grey at 1.34:1 is not a text colour under any circumstance. The
Insights pager used it for the disabled step, which is not a disabled
control, it is an invisible one. `--disabled-ink` replaced it.

The page ground is `#FAFBFC`, a hair off white, so a white card separates
from it without needing a border.

## Ink partners

Three colours exist for one job: to say what a brand colour says, at a size
a person can read. Reach for these the moment a brand hue has to become
type on a light ground.

| Colour | Token | Hex | On white | On off-white |
|---|---|---|---|---|
| Sage Ink | `--sage-ink` | `#5A6140` | 6.52 | 6.01 |
| Gold Ink | `--gold-ink` | `#6B6025` | 6.32 | 5.81 |
| Sage Dark | `--sage-dark` | `#535A38` | 7.27 | 6.70 |

`--sage-ink` exists because `--sage` lands between 4.36:1 and 4.48:1 on the
card greys. Every one of those failures was within a tenth of passing,
which is exactly the margin a slightly wider font on another machine eats.

`--sage-dark` is also the hover and pressed state for the primary button
and the text colour of the "Compatible" badge.

### Gold has a ground rule, not a contrast rule

`--gold-light` `#BFB060` measures 2.19:1 on white and 7.56:1 on the dark
navy. It is used as running text throughout the product pages and it is
correct there, because every one of those sections sits on a dark ground.

The rule is directional:

- **`--gold-light` is text on dark only.**
- **`--gold-ink` is text on light only.**

Swapping them produces a failure that looks fine in the editor and is the
one class of error the site's screenshot contrast audit cannot catch, since
it measures rendered pixels and both renderings are gold on something.

## Neutrals and grounds

| Colour | Token | Hex | Role | On white |
|---|---|---|---|---|
| Deep Navy | `--dark` | `#1A1E2E` | Headings, dark section grounds, hero scrim | 16.55 |
| Charcoal Blue | `--charcoal` | `#20242F` | Footer, "Why We Exist" ground | 15.50 |
| Body Ink | `--text` | `#2C3345` | Running text | 12.60 |
| Muted | `--muted` | `#565C6B` | Subtitles, captions, secondary lines | 6.69 |
| Disabled Ink | `--disabled-ink` | `#6E7369` | Inactive controls | 4.86 |
| Off White | `--offwhite` | `#F5F6F1` | Alternating sections, card fills | — |
| Page ground | — | `#FAFBFC` | The page itself | — |

The neutrals are warm-shifted rather than pure grey; they carry a trace of
the sage and navy they sit beside.

Charcoal Blue was named after the fact. The How It Works cards had been
landing on it by accident — four per cent white over the navy — and the
marketing lead picked it out of that section by eye. Naming it makes it a
colour the site has rather than a coincidence of two other values.

`--muted` was `#6B7280` and was independently failing at 4.45:1 against
`--offwhite`, where small text needs 4.5. One token, so every muted line on
the site moves together.

`--disabled-ink` exists because WCAG exempts inactive controls from the
contrast rule. That is a licence this site does not need to take.

## What each hue is allowed to mean

The three chromatic colours are not interchangeable. Each has a consistent
job on the live site, consistent enough to be a rule rather than a
description.

| Hue | Means | Appears as | Never |
|---|---|---|---|
| Sage | Action, and the affirmative answer | Primary button, active nav, blockquote rule, "Compatible", in-body links | A warning, or a neutral divider |
| Gold | Emphasis and sequence | Nav underline, pipeline numerals, eyebrows on dark, headline gradient, "Conditions apply" | A call to action, a status alone, or body text on light |
| Teal | The technical register, and the unresolved answer | Service-card links, capability tags, matrix chips, checkmarks, "Testing required" | A primary button, or a substitute for sage |

## Status colours

The compatibility quiz introduces no traffic-light palette. It reuses the
brand hues at roughly 16% fill with the measured ink on top, which is why a
status badge never looks imported from another system.

| State | Fill | Text | Border |
|---|---|---|---|
| Compatible | `rgba(107,114,73,.16)` | `#535A38` | `rgba(107,114,73,.35)` |
| Likely compatible | `rgba(162,147,73,.16)` | `#7A6D2E` | `rgba(162,147,73,.40)` |
| Testing required | `rgba(59,102,107,.14)` | `#3B666B` | `rgba(59,102,107,.34)` |
| Required field | — | `#B3261E` | — |

The required-field red is not a general error colour and has no other use.
It was chosen to clear 4.5:1 on both surfaces a form label sits on: 6.54:1
on white and 6.02:1 on off-white. A brighter red reads better as a warning
and fails as text.

## Proportion

The standing rule is that sage and white together hold at least 70% of a
layout, with gold as accent only. The stylesheet bears that out. Token
reference counts across 2,861 lines:

| Family | References |
|---|---|
| Sage (`--sage`, `--sage-dark`, `--sage-light`, `--sage-ink`) | 96 |
| Neutral dark (`--dark`, `--charcoal`) | 74 |
| Text and muted | 62 |
| Gold (`--gold`, `--gold-light`, `--gold-ink`) | 38 |
| Grounds (`--offwhite`, `--soft-sage`) | 30 |
| Teal (`--teal`, `--teal-light`) | 16 |

Gold sits at roughly one reference in eight. That is the accent discipline
working, and it is the number to check a new page against: if gold is
approaching sage in a layout, the layout is wrong before anyone has read a
word of it.

## Typography

**One typeface.** Montserrat carries every heading, every paragraph and
every label on the site — 64 `font-family` declarations, all of them
Montserrat. It is the only font the site loads.

| Role | Weight | Size | Notes |
|---|---|---|---|
| Hero | 700 | `clamp(2.5rem, 4.6vw, 3.9rem)` | `letter-spacing: -.02em` |
| Section title | 700 | `clamp(2.15rem, 4.1vw, 3rem)` | `letter-spacing: -.025em` |
| Section label | 600 | `1.14rem` | Sentence case, not uppercase |
| Body | 400 | `1rem` | `line-height: 1.6` |
| Section subtitle | 400 | `1.1rem` | `max-width: 640px`, `line-height: 1.7` |
| Tag | 700 | `.7rem` | Uppercase, `letter-spacing: .08em` |
| Button | 600 | `.95rem` | `border-radius: 10px` |

Two weights do nearly all the work: **600** for anything that labels or
acts (45 declarations) and **700** for anything that heads a block (42).
500 and 400 appear a handful of times; 800 appears exactly once, on the
technology-step numeral. Treat 300 and 800 as out of service. If a line
needs more presence it needs more size, not more weight.

Every heading carries `text-wrap: balance`, which evens the line lengths
instead of stranding one word underneath. Left-aligned body copy carries
`text-wrap: pretty` instead — balance in a text column leaves a hole down
the right-hand side, which is what it did to the About hero subtitle at
1100px before it was changed.

There is one shared type scale, not seventeen local overrides. The
12 August request list asked for a larger heading seventeen times — The
Challenge, About Natural Trace, Industries, Careers, FAQ, Our Story, and
the rest. They are all `.section-title`. Raising it once keeps the site a
system.

### The Bebas Neue conflict — unresolved

The company brand section specifies **Bebas Neue for display and titles,
Montserrat for body**. The website loads Montserrat alone, and
`src/assets/css/styles.css:1508` says so in as many words:

> Montserrat only. No Bebas Neue.

Nothing on the live site has ever been set in Bebas. So there are two
standards running: decks and PDFs set titles in Bebas Neue, the website
sets them in Montserrat 700. Both are defensible in isolation and they
cannot both be the standard.

This document records the web behaviour as built and does not resolve it.
The decision belongs to the marketing lead, and whichever way it goes, one
of the two surfaces changes.

## Seasonal themes are an accent layer

A theme may recolour the homepage hero scrim and add the strip above the
footer. It may not touch body text, cards, forms, buttons or any call to
action. That scope is what keeps a theme from making the pitch harder to
read, and it is why `themes.css` is a separate file that can be removed by
deleting one `<link>`.

Under any theme the hero button turns solid white with the theme's colour
as its label. The gold headline gradient is painted through
`background-clip: text`, which is the one element the screenshot contrast
audit cannot measure; going solid white closes that blind spot rather than
working around it.

## Standing rules

- **Measure before you ship a colour.** Every value here was verified
  against the grounds it lands on. A new colour arrives with its ratios or
  it does not arrive.
- **One token, one place.** When a colour changes, change the token.
  Seventeen local overrides is how a stylesheet stops having a palette.
- **Gold is directional.** `--gold-light` on dark, `--gold-ink` on light.
  Never the reverse.
- **Sage and white hold the layout**, at least 70%, gold as accent only.
- **Never set body text in Harvest Gold or Soft Sage Grey** on a light
  ground. They measure 3.09:1 and 1.34:1.
- **Never introduce a fourth hue.** Status, warning and emphasis are all
  served by sage, gold and teal at tint.
- **Never take the disabled-control exemption.** An inactive control still
  has to be legible.
- **Never use a third typeface.** Montserrat on the web, Calibri in Excel
  only.

## Open items

1. **Bebas Neue.** Deck standard and web standard disagree. One has to
   move. See above.
2. **The "Likely compatible" gold `#7A6D2E`.** The only chromatic ink on
   the site with no token behind it. It should become `--gold-ink-warm` or
   resolve to `--gold-ink`.
3. **`--teal-light` `#4D8489`.** Two references, and it fails as text on
   both white (4.22:1) and the dark navy (3.92:1). A surface colour with no
   ink partner — either give it one or retire it.
4. **The display type scale.** `CLAUDE.candidate.md` quotes a 32–40pt band
   written for a smaller canvas; the shipped cover runs 54pt and section
   dividers 44pt. The band needs rewriting to what is in use.

## How the figures were produced

Every ratio in this file came out of the snippet below, run against the hex
values in `styles.css`. It is here so the next person can check a new
colour without trusting this document, and so a disagreement with a design
tool can be settled by arithmetic.

```js
const L = h => {
  const c = [1, 3, 5]
    .map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

const ratio = (a, b) => {
  const x = L(a), y = L(b);
  return ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2);
};

ratio('#6B7249', '#FFFFFF');   // 5.09
ratio('#A29349', '#FFFFFF');   // 3.09 — fails AA for body text
ratio('#DEDFDE', '#FFFFFF');   // 1.34
```

The calculator agrees with the figures already recorded in the stylesheet's
own comments to the second decimal, including the 1.34:1 that condemned the
disabled pager step. Those comments are trustworthy.

## Related

- `src/assets/css/styles.css` — the tokens themselves, in the `:root` block
  at the top, each with the measurement that produced it
- `src/assets/css/themes.css` — the seasonal accent layer and its scope rule
- `docs/content-decisions.md` — why the words say what they say
- `docs/claim-review.yml` — the claim register, enforced on every build
- `Design Systems/Client Design System/DESIGN-SYSTEM.md` — the chart
  standard for client-facing and internal work, which is a separate document
  and is not superseded by this one
