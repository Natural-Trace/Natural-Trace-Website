# Partner logos

Every logo shown in the "Our Partners" bar on the home page lives in this folder.

## Adding a partner

1. Save the logo file here. PNG with a transparent background is best; SVG and
   JPG also work. Trim the whitespace around the mark first, or it will render
   smaller than the logos beside it.
2. Open `src/_data/home.yml`, find `trust_logos`, and add a block:

   ```yaml
     - url: "https://example.com/"
       image: "/assets/partners/Example.png"
       alt: "Example Ltd"
   ```

   `url` is where the logo links to, `alt` is the text a screen reader reads out.

The bar renders every logo at 40px tall, in greyscale, and returns it to full
colour on hover. Nothing else needs changing.
