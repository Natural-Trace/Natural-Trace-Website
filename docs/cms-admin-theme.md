# The admin panel's appearance

The CMS at `/admin/` is [Decap CMS](https://decapcms.org/). Decap has no theming
system. It exposes exactly one appearance setting, the logo. Everything else
about how the panel looks is done here, by overriding Decap's own styles.

Three files do it:

| File | What it does |
| --- | --- |
| `src/admin/config.yml` | `logo`, `site_url`, `display_url`, `locale`. Supported Decap options. |
| `src/admin/theme.css` | Colours, type and spacing. Overrides Decap's internals. |
| `src/admin/preview.js` | The live article preview in the editor's right-hand pane. |

`theme.css` and `preview.js` both carry long comments explaining how they work
and what breaks them. Read those before editing either.

## Why the Decap version is pinned

`src/admin/index.html` loads an exact version:

```html
<script src="https://unpkg.com/decap-cms@3.15.1/dist/decap-cms.js"></script>
```

It used to load `decap-cms@^3.0.0`, which resolves to whatever unpkg is serving
at the moment the page loads. With no customisation that is harmless. With
`theme.css` targeting Decap's internal class names it is not: a release
published on any random Tuesday could change the panel with nobody having
touched this repository, and the first person to find out would be whoever
logged in next.

The pin is not there to avoid upgrading. It is there so that upgrading is a
decision someone makes and then checks.

## How to upgrade Decap

Budget about ten minutes.

1. Check what is current: <https://github.com/decaporg/decap-cms/releases>
2. Change the version in `src/admin/index.html` to the new one. One number.
3. Build and serve the site locally, or push to a branch and open its preview.
4. Log in to `/admin/` and look at, in this order:
   - the login screen: dark background, white Natural Trace wordmark, teal
     "Login with GitHub" button
   - the header: dark, wordmark on the left, teal "Quick add"
   - the sidebar: the selected collection is teal with a teal left edge, not blue
   - a collection list: white cards with a thin border, teal border on hover
   - open an article: the field label you are editing is teal with white text,
     "Save" is teal, and the right-hand pane shows the article in the site's own
     fonts and styles rather than a list of fields
   - open Home: one full-width column of fields and no right-hand pane at all.
     The preview is switched off everywhere except Insights by `editor:` at the
     top of `config.yml`. If a pane has come back, the upgrade changed how that
     setting is read
   - the Insights list: newest article first with its date in the row, and
     "Filter by" offering the six topics and Pinned
5. Anything still Decap blue, or any block of styling that has reverted to
   Decap's defaults, means a component was renamed. Find the new name in the
   browser's element inspector (the class will read `css-<hash>-<NewName>`) and
   update the matching selector in `theme.css`.

If you do not have time to do step 4, do not do step 2. Leaving the pin where it
is has no downside beyond missing new Decap features. Decap runs entirely in the
browser of a logged-in editor and holds no data of its own, so an old version is
not a data risk the way an old server would be.

## If the panel ever looks broken

Delete the `<link rel="stylesheet" href="theme.css" />` line from
`src/admin/index.html` and push. The panel goes back to stock Decap: plain, blue,
and fully working. Nothing in the CMS depends on the theme. Same for
`preview.js`: remove the `<script>` tag and the Insights editor falls back to
Decap's default preview pane. The other editors have no preview pane to fall
back to; that is `editor: preview: false` in `config.yml`, not this file.

That is deliberate. Both files are decoration over a working panel, not part of
it.
