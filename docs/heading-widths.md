# Headings that will not fit on one line

Section heads across the site share one width, `--section-head-width` in
`src/assets/css/styles.css`, currently 1000px. That number was picked by
measurement rather than taste: at 1000px every centred section title on the
site holds one line at a 1440px viewport, except the ones listed here.

Widening the wrapper was the fix, not shrinking the type. Before it, the heads
were capped at 700 to 760px, which is a sensible measure for a paragraph and
far too narrow for a 42px heading, so titles were wrapping inside containers
with 400px of unused room on either side.

Wrapping on a phone is expected and is not in scope. Nothing below 900px wide
is going to hold a seven word heading at a size worth reading.

## Cannot fit at any sensible size

These need the wording shortened. Each one is a decision for whoever owns the
copy, not a CSS change. The width given is what the current wording needs at
the current type size, against the 1000px a section head gets.

| Page | Heading | Needs | Has |
| --- | --- | --- | --- |
| `/` | The First Authentication Platform Validated for Premium Food and Nutraceutical Ingredients | 1967px | 1000px |
| `/careers/` | Help Build the Future of Product Authentication | 1517px | 836px |
| `/team/` | Meet the Team Protecting the Future of Premium Ingredients | 1300px | 760px |
| `/about/` | Validated Across 20+ Categories Most at Risk of Fraud | 1127px | 1000px |

The careers and team pages have a narrower container than the rest of the site,
900px and 1200px, because they were built on the legal page layout. Widening
that container would fix both without touching the words, but it changes the
shape of those two pages, so it is worth deciding rather than assuming.

## Two lines on purpose

Not faults. Listed so nobody tries to fix them.

- `/about/` **From a Simple Question<br>to a New Approach** carries an explicit
  line break in `about.yml`.
- `/about/` **Designed for Real-World Manufacturing. Backed by Science.** is two
  sentences. Running them together on one line loses the pause the full stop is
  doing.
- `/` **Your Product is Unique. Can You Prove It's Yours?** is also two
  sentences, and it sits in a grid column beside an image, so it has 563px
  whatever the head width is set to.
- `/about/` **Protecting the Future of Premium Ingredients** is in the same grid
  column, same 563px.
- Article titles under `/insights/` are as long as the article needs. Two to
  five lines is normal for those and nothing should be forced.

## Re-running the measurement

There is no script for this in the repo yet. The measurement is: for each
heading, take a Range over its contents, sum the widths of the client rects and
add a space between each pair, and compare that against the parent's content
box. The parent matters, not the element: `text-wrap: balance` shrinks the
element's own box to the balanced result, so measuring the element reports the
width it chose rather than the width it could have had.
