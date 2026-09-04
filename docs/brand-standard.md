# Colour and type standard

The Natural Trace palette and type scale, with every colour measured against
the surface it lands on.

This is the general project standard, not a website document. It governs
branded PDF reports, Excel workbooks, COA and client charts, the NaturalDetect
and NaturalCloud interfaces, the website, and any new project surface. Where a
surface needs its own rule — Calibri instead of Montserrat, no digits on a
client chart — that rule is stated here rather than kept somewhere else.

> **Slide decks are out of scope.** Deck typography, the point scale and slide
> layout belong to the slide design system — recorded in `CLAUDE.md` §9 and
> applied by the `slide-review` and `pptx` skills — which is not superseded by
> this file and does not defer to it. The palette below is shared: a deck uses
> the same five colours and the same ink partners. Nothing here overrides how a
> deck is set.

Every ratio below was recomputed from the hex values. None is quoted on trust.
The method is at the end so the next colour can be checked without trusting
this document.

Drawn 4 September 2026. Contrast is WCAG 2.1: **4.5:1** for body text, **3:1**
for large text and for non-text marks that carry meaning, **7:1** for AAA.

## Scope

| Surface | Governed here | Owned elsewhere |
|---|---|---|
| Website | Palette, type scale, states | Copy — `docs/content-decisions.md` |
| PDF reports | Palette, type, chart colour | Report templates |
| Excel workbooks | Palette, Calibri rule | Formula and column conventions in `CLAUDE.md` |
| COA and client charts | Series colour, threshold-line colour, the no-digits rule | Composition — `Design Systems/Client Design System/DESIGN-SYSTEM.md` |
| App interfaces | Palette, states | Component behaviour |
| New project surfaces | Everything, until they have their own spec | — |
| **Slide decks** | **Nothing — colour values shared for reference only** | **The slide design system, in full** |

Where this document and a surface-specific spec disagree about a **colour**,
this document is right. Where they disagree about **layout or composition**,
the surface-specific spec is right.

## Why this file exists

There was no written colour standard anywhere. There was a five-colour list in
`CLAUDE.md`, a folder of logos under `Brand/`, and one stylesheet in which the
actual system had been worked out properly — seventeen tokens, several of which
exist purely to stop a brand colour being used where it fails.

Because that working-out lived in one repository, it never reached the decks,
the reports or the Excel templates. That is how the same five colours produce a
compliant web page and a slide with unreadable body copy, in good faith, in the
same week.

Harvest Gold measures 3.09:1 on white. Nothing in the five-colour list says so.

## The rule everything else follows

**A brand colour and a text colour are not the same object.**

Five colours identify Natural Trace. Only some of them can hold a sentence. The
system carries both — a *surface* colour for fills, and a measured *ink*
partner for type — and that is the entire reason the palette has seventeen
values rather than five.

Harvest Gold at `#A29349` is 3.09:1 on white, below the 4.5:1 floor, so gold is
a fill, a rule, a numeral plate, never a paragraph. Sage Olive clears white at
5.09:1 but falls to 4.68:1 on off-white and 3.81:1 on Soft Sage Grey. Each of
those is a real ground on real work, which is why every ratio here is quoted
per ground and not as one headline number.

This is the rule that travels worst between surfaces. A designer moving a
colour from a web page to a slide carries the hex and loses the ground.

## Core identity colours

| Colour | Token | Hex | Role | On white |
|---|---|---|---|---|
| Sage Olive | `--sage` | `#6B7249` | Primary. Actions, active states, rules, affirmative status | 5.09 |
| Harvest Gold | `--gold` | `#A29349` | Accent only. Underlines, numerals, eyebrows on dark, reference lines | **3.09 fails as text** |
| Deep Teal | `--teal` | `#3B666B` | Technical and analytical emphasis. Secondary links, tags, baseline series | 6.37 |
| Soft Sage Grey | `--soft-sage` | `#DEDFDE` | Dividers, hairlines, inactive tracks | **1.34 fails as text** |
| Pure White | — | `#FFFFFF` | Card, panel and chart ground | — |

Sage Olive is the only colour used for a primary call to action, on any
surface.

Deep Teal is the only chromatic brand colour that passes as text on every
ground in use, unmodified. It needs no ink partner.

Soft Sage Grey at 1.34:1 is not a text colour under any circumstance. It was
used for a disabled control on the website, which is not a disabled control, it
is an invisible one.

## Ink partners

Three colours exist for one job: to say what a brand colour says, at a size a
person can read. Reach for these the moment a brand hue has to become type on a
light ground — on a slide exactly as much as on a screen.

| Colour | Token | Hex | On white | On off-white |
|---|---|---|---|---|
| Sage Ink | `--sage-ink` | `#5A6140` | 6.52 | 6.01 |
| Gold Ink | `--gold-ink` | `#6B6025` | 6.32 | 5.81 |
| Sage Dark | `--sage-dark` | `#535A38` | 7.27 | 6.70 |

Sage Ink exists because Sage Olive lands between 4.36:1 and 4.48:1 on the card
greys. Every one of those failures was within a tenth of passing, which is
exactly the margin a slightly wider font on another machine eats.

Sage Dark is also the pressed and hover state for a primary control, and the
text colour of an affirmative status badge.

### Gold has a ground rule, not a contrast rule

Harvest Gold Light `#BFB060` measures 2.19:1 on white and 7.56:1 on the dark
navy. It is correct as running text on a dark slide or a dark product section,
and wrong on anything pale.

- **`--gold-light` is text on dark only.**
- **`--gold-ink` is text on light only.**

Swapping them produces a failure that looks fine in the editor and passes a
screenshot audit, because both renderings are gold on something.

## Neutrals and grounds

| Colour | Token | Hex | Role | On white |
|---|---|---|---|---|
| Deep Navy | `--dark` | `#1A1E2E` | Headings, dark grounds, hero and cover scrims | 16.55 |
| Charcoal Blue | `--charcoal` | `#20242F` | Secondary dark ground, footers | 15.50 |
| Body Ink | `--text` | `#2C3345` | Running text | 12.60 |
| Muted | `--muted` | `#565C6B` | Subtitles, captions, secondary lines, axis labels | 6.69 |
| Disabled Ink | `--disabled-ink` | `#6E7369` | Inactive controls | 4.86 |
| Off White | `--offwhite` | `#F5F6F1` | Alternating grounds, card and table fills | — |
| Page ground | — | `#FAFBFC` | Default document ground | — |

The neutrals are warm-shifted rather than pure grey; they carry a trace of the
sage and navy they sit beside. Substituting a stock grey — Excel's default, a
template's default — is visible immediately next to anything else on this list.

Charcoal Blue was named after the fact. Cards had been landing on it by
accident, four per cent white over the navy, and the marketing lead picked it
out by eye. Naming it makes it a colour we have rather than a coincidence of
two other values.

Muted was `#6B7280` and was failing at 4.45:1 on off-white, where small text
needs 4.5. One token, so every secondary line moves together.

Disabled Ink exists because WCAG exempts inactive controls from the contrast
rule. That is a licence we do not need to take.

## What each hue is allowed to mean

The three chromatic colours are not interchangeable. Each has a consistent job,
consistent enough to be a rule rather than a description, and it holds across
surfaces: teal means the same thing on a slide as in a badge.

| Hue | Means | Appears as | Never |
|---|---|---|---|
| Sage | Action, and the affirmative answer | Primary control, active state, tag series in a chart, "Compatible", in-body links | A warning, or a neutral divider |
| Gold | Emphasis and sequence | Underlines, step numerals, eyebrows on dark, threshold and reference lines, "Conditions apply" | A call to action, a status alone, or body text on light |
| Teal | The technical register, and the unresolved answer | Secondary links, capability tags, baseline series in a chart, "Testing required" | A primary control, or a substitute for sage |

## Status colours

Status introduces no traffic-light palette. It reuses the brand hues at roughly
16% fill with the measured ink on top, which is why a status badge never looks
imported from another system.

| State | Fill | Text | Border |
|---|---|---|---|
| Compatible | `rgba(107,114,73,.16)` | `#535A38` | `rgba(107,114,73,.35)` |
| Likely compatible | `rgba(162,147,73,.16)` | `#7A6D2E` | `rgba(162,147,73,.40)` |
| Testing required | `rgba(59,102,107,.14)` | `#3B666B` | `rgba(59,102,107,.34)` |
| Required field | — | `#B3261E` | — |

The required-field red is not a general error colour and has no other use. It
was chosen to clear 4.5:1 on both surfaces a form label sits on: 6.54:1 on
white and 6.02:1 on off-white. A brighter red reads better as a warning and
fails as text.

## Proportion

Sage and white together hold at least 70% of a layout, with gold as accent
only. That is the stated rule and the implementation bears it out. Token
reference counts across the website stylesheet:

| Family | References |
|---|---|
| Sage (`--sage`, `--sage-dark`, `--sage-light`, `--sage-ink`) | 96 |
| Neutral dark (`--dark`, `--charcoal`) | 74 |
| Text and muted | 62 |
| Gold (`--gold`, `--gold-light`, `--gold-ink`) | 38 |
| Grounds (`--offwhite`, `--soft-sage`) | 30 |
| Teal (`--teal`, `--teal-light`) | 16 |

Gold sits at roughly one reference in eight. That is the accent discipline
working, and it is the number to check a new page or report against: if gold is
approaching sage, the layout is wrong before anyone has read a word of it.

## Charts

Chart colour is where this standard earns its keep, because a chart is the one
artefact that goes to a client, gets printed, gets photocopied, and gets read
by someone who has never seen the brand.

### Internal and COA charts

Clustered bar. Deep Teal baseline bars, Sage Olive tag bars, Harvest Gold
dashed threshold line. White ground, light grey gridlines, legend at the top,
white data labels inside the bars. Y-axis reads "Signal Level".

The white data labels are sound: white on a sage bar is 5.09:1 and on a teal
bar 6.37:1, both clear of the 4.5:1 floor. It is also why gold is a line and
never a bar in this standard — white on gold is 3.09:1 and fails.

### Client-facing charts

Same series colours. **No digits anywhere**: no axis values, no ticks, no
gridline labels, no data labels, no threshold number. The threshold line
carries its name and nothing else. Sample labels take letter suffixes
(Untagged A, Untagged B) so the rule stays absolute rather than becoming a
judgement call.

Composition and enforcement live in `Design Systems/Client Design System/`
and `leakcheck.py`. This document owns only the colours.

### Two defects the measurement found

Both are in the chart standard as written, both are invisible on screen, and
neither has been fixed.

**1. The two series are the same lightness.** Sage Olive against Deep Teal is
**1.25:1**. They differ in hue — olive against blue-green — and almost not at
all in luminance. Printed greyscale, photocopied, or seen by a reader with a
red-green deficiency, the tag bars and the baseline bars are one series. On a
COA chart that is the difference between tagged and untagged.

No pair in the current palette fixes this by colour alone. The best available
separation is Sage Light against Deep Teal at 1.95:1, still far under the 3:1
a graphical distinction needs:

| Pair | Separation |
|---|---|
| Sage vs Teal (current) | 1.25 |
| Sage vs Teal Light | 1.21 |
| Sage Dark vs Teal Light | 1.72 |
| Sage Light vs Teal | 1.95 |

So the fix is not chromatic. Differentiate the two series by **fill pattern or
bar outline** — a hatch on the baseline series, or a Deep Navy outline on the
tag series — which costs nothing, survives greyscale and a photocopier, and
does not require inventing a colour outside the palette. Decision open.

**2. The threshold line is the least visible mark on the chart.** Harvest Gold
on white is 3.09:1, three per cent above the 3:1 floor for a meaningful
non-text mark. Where the dashed line crosses a light grey gridline it drops to
**2.49:1 and fails outright.** On a COA chart the threshold is the single most
important mark, and it is the faintest thing drawn.

This one does have an in-palette fix. Gold Ink `#6B6025` measures 6.32:1 on
white and 5.10:1 over the gridlines, reads as the same colour family, and needs
no new value:

| Line colour | On white | Over gridline |
|---|---|---|
| Harvest Gold `#A29349` (current) | 3.09 | **2.49 fails** |
| Gold Light `#BFB060` | 2.19 | **1.77 fails** |
| Gold Ink `#6B6025` | 6.32 | 5.10 |

Recommended: **the threshold line becomes Gold Ink on any light ground.** Gold
stays as written on dark grounds, where it is already clear.

## Typography

### Screen — web and app interfaces

**Montserrat only.** One typeface carries every heading, paragraph and label.

| Role | Weight | Size |
|---|---|---|
| Hero | 700 | `clamp(2.5rem, 4.6vw, 3.9rem)`, `-.02em` |
| Section title | 700 | `clamp(2.15rem, 4.1vw, 3rem)`, `-.025em` |
| Section label | 600 | `1.14rem`, sentence case |
| Body | 400 | `1rem`, `line-height: 1.6` |
| Subtitle | 400 | `1.1rem`, `max-width: 640px` |
| Tag | 700 | `.7rem`, uppercase, `.08em` |
| Button | 600 | `.95rem`, `border-radius: 10px` |

Two weights do nearly all the work: **600** for anything that labels or acts,
**700** for anything that heads a block. Treat 300 and 800 as out of service.
If a line needs more presence it needs more size, not more weight.

Headings take `text-wrap: balance`, which evens the line lengths instead of
stranding one word underneath. Left-aligned body copy takes `text-wrap: pretty`
instead — balance in a text column leaves a hole down the right-hand side.

One shared scale, not local overrides. A request list once asked for a larger
heading seventeen times; they were all one rule. Raising it once keeps the
system a system.

### Print — reports and documents

Report and document typography follows the report templates. The one rule that
travels from the deck standard and is worth keeping everywhere on paper:
**nothing a reader needs in order to interpret a chart or a table goes below
11 pt.** Footer sizes are for provenance and page numbers, never for content.

The deck point scale is not reproduced here. It belongs to the slide design
system and would go stale the first time that system moved.

### Excel

**Calibri only**, and only in Excel. Calibri appears on no other surface;
Montserrat and Bebas appear in no workbook. The palette is unchanged — the same
hex values, entered as custom colours rather than picked from Excel's defaults,
which are not these colours and read as wrong beside anything else we produce.

### Bebas Neue — deliberately not here

The brand section specifies Bebas Neue for display and titles. That is the
deck standard and it stays the deck standard; decks are out of scope above.

On the surfaces this file does govern, **there is no Bebas**. The website has
never loaded it and says so in its own stylesheet — *"Montserrat only. No
Bebas Neue."* — and the same holds for app interfaces and reports.

Recording it as a divergence rather than a conflict: a deck and a web page are
set in different faces on purpose, and anyone who notices should know it was
decided rather than drifted. If that ever stops being acceptable, the decision
is the marketing lead's and it starts from the slide design system, not here.

## Standing rules

- **Measure before you ship a colour.** Every value here was verified against
  the grounds it lands on. A new colour arrives with its ratios or it does not
  arrive.
- **Carry the ground, not just the hex.** A colour approved on one surface is
  not approved on another until it is measured there.
- **Gold is directional.** Gold Light on dark, Gold Ink on light. Never the
  reverse.
- **Sage and white hold the layout**, at least 70%, gold as accent only.
- **Never set body text in Harvest Gold or Soft Sage Grey** on a light ground.
  They measure 3.09:1 and 1.34:1.
- **Never introduce a fourth hue.** Status, warning and emphasis are all served
  by sage, gold and teal at tint. Where two things must be told apart and the
  palette cannot do it, use pattern, weight or outline — not a new colour.
- **Never take the disabled-control exemption.** An inactive control still has
  to be legible.
- **Never use a third typeface on a surface this governs.** Montserrat on
  screen and in reports, Calibri in Excel only. Bebas belongs to decks and
  appears on nothing here.
- **Never print a digit on a client-facing chart.** See the client design
  system; enforced by `leakcheck.py`.

## Open items

1. **Chart series separation.** Sage against teal is 1.25:1 and no palette pair
   reaches 3:1. Needs a pattern or outline decision, not a colour. Affects any
   surface that draws a clustered bar, decks included, so it wants coordinating
   with whoever owns the slide charts.
2. **The threshold line.** Fails at 2.49:1 where it crosses a gridline. Gold
   Ink fixes it in palette; needs sign-off before the chart templates change.
   Same coordination point.
3. **The "Likely compatible" gold `#7A6D2E`.** The only chromatic ink in use
   with no token behind it. Give it one or resolve it to Gold Ink.
4. **Teal Light `#4D8489`.** Fails as text on white (4.22:1) and on the navy
   (3.92:1). A surface colour with no ink partner — give it one or retire it.

## How the figures were produced

Every ratio here came out of the snippet below. It is included so a new colour
can be checked without trusting this document, and so a disagreement with a
design tool can be settled by arithmetic rather than by eye.

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

ratio('#6B7249', '#FFFFFF');   // 5.09  sage on white
ratio('#A29349', '#FFFFFF');   // 3.09  gold on white — fails as text
ratio('#DEDFDE', '#FFFFFF');   // 1.34  soft sage on white
ratio('#6B7249', '#3B666B');   // 1.25  sage against teal — the chart defect
```

The calculator agrees with the figures already recorded in the website
stylesheet comments to the second decimal, including the 1.34:1 that condemned
a disabled control. Those comments are trustworthy.

## Where this is enforced in code

Only one surface enforces any of this automatically. That asymmetry is worth
knowing when deciding how much to trust a given artefact.

| Surface | Enforcement |
|---|---|
| Website | Tokens in `src/assets/css/styles.css`, each carrying the measurement that produced it; contrast audited on build |
| Client charts | `leakcheck.py` blocks digits and verdict strings |
| PDF reports, Excel, app UIs | **Nothing. Convention only.** |

## Related

- `CLAUDE.md` §9 — the five-colour summary this document expands, and the
  **slide standard**, which this document does not govern: the deck point
  scale, Bebas Neue for titles, and the 60-slide format
- `src/assets/css/styles.css` — the tokens, with the measurement behind each
- `src/assets/css/themes.css` — the seasonal accent layer and its scope rule
- `Design Systems/Client Design System/DESIGN-SYSTEM.md` — chart composition
  and the client-facing rules
- `Brand/Logos/` — the marks. Transparent-background PNG for light grounds,
  the white mark for dark grounds
- `docs/content-decisions.md` — why the website words say what they say
