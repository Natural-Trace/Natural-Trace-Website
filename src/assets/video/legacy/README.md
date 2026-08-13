# Superseded video assets

Kept for reference only. Nothing on the site points at anything in this folder.

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
