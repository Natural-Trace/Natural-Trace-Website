/* ---------------------------------------------------------------------------
   Live article preview for the Decap CMS editor.

   Without this, the right-hand pane of the article editor is Decap's generic
   field dump: every field printed as a labelled block in Decap's own fonts. It
   tells an editor nothing about what the published article will look like.

   Two supported Decap APIs do the work, both documented at
   https://decapcms.org/docs/customization/

     CMS.registerPreviewStyle    loads a stylesheet into the preview iframe
     CMS.registerPreviewTemplate replaces the preview markup for a collection

   The markup below deliberately mirrors src/_includes/layouts/post.njk class
   for class. That is the whole trick: because the classes match and the site's
   own stylesheet is loaded into the iframe, the preview is styled by the real
   site CSS rather than by a copy of it. Change post.njk and this file needs the
   same change, or the preview quietly stops matching the page.

   No build step. Decap exposes React's createElement as window.h, so this is
   plain JavaScript that any browser will run as-is.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var h = window.h;

  if (!window.CMS || !h) {
    // Nothing to attach to. The editor still works, it just gets Decap's
    // default preview, so fail quietly rather than breaking the panel.
    if (window.console) console.warn('Preview: CMS not ready, using Decap default preview.');
    return;
  }

  /* The site lives under a path prefix on GitHub Pages
     (/Natural-Trace-Website/) and would live at / on a custom domain. Deriving
     the prefix from where this page actually is means neither move needs an
     edit here. */
  var base = window.location.pathname.replace(/admin\/?$/, '');

  CMS.registerPreviewStyle('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
  CMS.registerPreviewStyle(base + 'assets/css/styles.css');

  /* Preview-only corrections. The article page is designed to sit under a fixed
     site header, so it carries 8rem of top padding that would just be dead
     space in a preview pane a third the width of a screen. */
  CMS.registerPreviewStyle(
    'body{background:#fff}' +
    '.insight-post{padding:1.5rem 0 3rem}' +
    '.insight-post .container{padding:0 1.5rem}' +
    '.insight-preview-empty{color:#6B7280;font-style:italic}' +
    /* widgetFor("body") wraps the rendered markdown in a Decap container that
       carries its own margin. Left alone it pushes the article body out of
       alignment with the heading above it. */
    '.insight-body [class*="-WidgetPreviewContainer"]{margin:0}',
    { raw: true }
  );

  function formatDate(value) {
    if (!value) return '';
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function ArticlePreview(props) {
    var entry = props.entry;
    var get = function (field) { return entry.getIn(['data', field]); };

    var title = get('title');
    var image = get('image');
    var tags = get('tags');
    var pinned = get('pinned');

    /* An image that has been picked but not yet committed exists only in the
       browser, so ask Decap for it rather than using the raw path. */
    var imageSrc = image ? props.getAsset(image) : null;

    var tagList = tags && tags.toArray ? tags.toArray() : (tags || []);

    return h('section', { className: 'insight-post' },
      h('div', { className: 'container' },
        h('div', { className: 'insight-post-header' },
          h('span', { className: 'section-label' }, pinned ? 'Insights, pinned to the top' : 'Insights'),
          h('h1', {}, title || h('span', { className: 'insight-preview-empty' }, 'Headline goes here')),
          h('div', { className: 'insight-meta' },
            h('time', {}, formatDate(get('date'))),
            get('author') ? h('span', { className: 'insight-author' }, ' by ' + get('author')) : null
          ),
          tagList.length
            ? h('div', { className: 'insight-tags' },
                tagList.map(function (tag, i) {
                  return h('span', { className: 'insight-tag', key: 'tag-' + i }, String(tag));
                })
              )
            : null
        ),

        imageSrc
          ? h('div', { className: 'insight-featured-image' },
              h('img', { src: imageSrc, alt: title || '' })
            )
          : null,

        h('div', { className: 'insight-body' }, props.widgetFor('body'))
      )
    );
  }

  CMS.registerPreviewTemplate('insights', ArticlePreview);
})();
