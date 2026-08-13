# Superseded assets

Kept in git for reference. This folder sits at the repository root, outside
`src/`, on purpose: Eleventy's input directory is `src` and
`addPassthroughCopy("src/assets")` copies everything under it, so anything left
in `src/assets` is published to the live site whether or not a page links to
it. A superseded file with visible misspellings should not be reachable at a
guessable URL.

Nothing here is built, deployed or linked.

## NaturalTag Process (Gemini original).mp4

The first version of the supply chain animation, generated with Gemini and live
on the NaturalTag page until 13 August 2026. Replaced because of faults the
model introduced and could not be prompted out of:

- The hex codes `#6B7249` and `#A29349` are lettered on screen as green label
  plates in every frame. They were typed into the prompt as colour instructions
  and the model rendered them as text.
- Six or more free floating magnifying glasses, attached to nothing.
- Misspellings that change between frames: "CONSUMATE", "MAREKTPLACE".
- The leaf inside the cloud is the model's redrawing, not the Natural Trace
  mark.

If any frame of this file is ever reused, check it letter by letter first.

The replacement is built deterministically from an SVG scene rather than
generated, so the labels are text nodes and the leaf and cloud are the actual
PNGs from `src/assets/logos/`.
