const yaml = require("js-yaml");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { HtmlBasePlugin } = require("@11ty/eleventy");

/* Cache busting for the stylesheet and the script.
 *
 * Both were linked at a plain path, so a browser that had seen the site before
 * kept serving its cached copy after a deploy. On 8 Aug that meant a hero fix
 * was live on the server, correct in the file, and still broken on screen for
 * anyone who had visited before: the page HTML was the new one, the stylesheet
 * next to it was three commits old. It looks exactly like a bug that will not
 * die, and no amount of checking the source finds it.
 *
 * The hash is of the file contents, so the URL only changes when the file
 * does. Unchanged assets stay cached, changed ones cannot be.
 */
function assetVersion(file) {
  try {
    return crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 10);
  } catch {
    // Missing file is the build's problem to report, not this helper's.
    return "dev";
  }
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  // Enable YAML data files (.yml / .yaml)
  eleventyConfig.addDataExtension("yml,yaml", contents => yaml.load(contents));

  // Expose pathPrefix as global data for JS use in templates
  const prefix = process.env.PATH_PREFIX || "/";
  eleventyConfig.addGlobalData("sitePathPrefix", prefix);

  // Read once per build, not once per page.
  eleventyConfig.addGlobalData("assetVersions", {
    css: assetVersion("src/assets/css/styles.css"),
    js: assetVersion("src/assets/js/main.js"),
    themes: assetVersion("src/assets/css/themes.css"),
  });

  // Date filter for templates
  eleventyConfig.addFilter("date", (dateObj, format) => {
    const d = new Date(dateObj);
    const months = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    if (format === "%Y-%m-%d") {
      return d.toISOString().slice(0, 10);
    }
    if (format === "%B %d, %Y") {
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`;
    }
    // "27 Aug 2026", for the Insights rows. Short enough to sit under a
    // headline in a 640px text column without wrapping, where the full
    // "August 27, 2026" was competing with the headline for width.
    if (format === "%d %b %Y") {
      return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
    }
    /* Every format used anywhere in src/ is handled above; this is only
       reachable by a typo in a new one. It used to fall through to
       toLocaleDateString(), which is the worst possible behaviour here: it
       returns whatever the machine running the build is set to, so a mistyped
       format renders "27/08/2026" on a laptop, something else in CI, and never
       errors on either. A date is not a place to be quietly locale-dependent
       on a site read from Singapore, the US and Europe. */
    throw new Error(
      `date filter: unsupported format "${format}".\n` +
      `  Supported: "%Y-%m-%d", "%B %d, %Y", "%d %b %Y".\n` +
      `  Add the format to the filter in .eleventy.js rather than relying on ` +
      `the locale of whichever machine happens to run the build.`
    );
  });

  // RFC 822 dates, which is what RSS 2.0 requires and nothing else on this
  // site needs. Written out by hand rather than taken from toUTCString(),
  // which produces "GMT" where the spec asks for a numeric offset. Several
  // feed readers accept both; the ones that do not fail silently, and a
  // scheduler that cannot parse the date treats every item as new and posts
  // the whole archive to LinkedIn at once.
  eleventyConfig.addFilter("rssDate", dateObj => {
    const d = new Date(dateObj);
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"];
    const p = n => String(n).padStart(2, "0");
    return `${days[d.getUTCDay()]}, ${p(d.getUTCDate())} ${months[d.getUTCMonth()]} `
      + `${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:`
      + `${p(d.getUTCSeconds())} +0000`;
  });

  // Enclosure MIME type from the filename. jpg and jpeg are the same type and
  // the migrated archive contains both spellings.
  eleventyConfig.addFilter("imageType", path => {
    const ext = String(path).split(".").pop().toLowerCase();
    return ext === "jpg" ? "jpeg" : ext;
  });

  /* A <br> an editor typed into a headline is a chosen break, and the
     stylesheet hides those below 700px because the column is too narrow there
     for a chosen break to beat the browser's.
     Hiding a <br> joins the words either side of it. "Your Product is
     Unique.<br>Can You Prove It's Yours?" set as "Unique.Can You Prove" on a
     phone, and "Protecting the Future of<br>Premium Ingredients" as
     "ofPremium". Both shipped, because the desktop rendering is correct and
     that is where a headline gets looked at.
     Putting a space in the field would fix it and would depend on every editor
     remembering. This guarantees one. A trailing space before a line break is
     collapsed by the browser, so nothing moves where the break is shown. */
  eleventyConfig.addFilter("softBreak", value =>
    typeof value === "string" ? value.replace(/\s*<br\s*\/?>/gi, " <br>") : value
  );

  // Per-page SEO lookup from src/_data/seo.yml, keyed by URL
  eleventyConfig.addFilter("seoLookup", (pages, url) =>
    (pages || []).find(p => p.url === url) || {}
  );

  /* A pasted LinkedIn post address, turned into the address LinkedIn's own
     embed player answers on. "Copy link to post" hands out two shapes and we
     have no say over which one an editor gets:

       https://www.linkedin.com/posts/natural-trace_slug-activity-7123…-AbCd
       https://www.linkedin.com/feed/update/urn:li:activity:7123…/

     and both exist in share and ugcPost variants. The embed endpoint wants the
     URN form, so the job is to find the type and the id wherever they are
     hiding. The type is carried through rather than flattened to "activity":
     a share URN answered on the activity endpoint returns an empty frame.

     An address that fits neither shape throws, which fails the build and the
     pull request check with the pasted string in the message. The alternative
     is rendering a frame that quietly shows nothing, on a page nobody rebuilds
     for weeks, with no way to tell which of three entries is the broken one.
     A build that stops is a bad paste; it is not a broken site. */
  eleventyConfig.addFilter("linkedinEmbed", url => {
    const pasted = String(url ?? "").trim();

    // URN form first: a /feed/update/ address carries no "-activity-" token,
    // so the slug pattern below would never match it.
    let found = pasted.match(/urn:li:(activity|share|ugcPost):(\d+)/);

    /* The /posts/ form, where the id sits inside the slug. Bounded at ten
       digits so a number an editor happened to write in the post's own title
       ("-activity-2026-…") cannot be mistaken for one. Real ids are 19. */
    if (!found) found = pasted.match(/-(activity|ugcPost)-(\d{10,25})\b/);

    if (!found) {
      throw new Error(
        `linkedinEmbed: no LinkedIn post ID in "${pasted}".\n` +
        `  This is the "Address of the post" field of an entry under ` +
        `"From our LinkedIn" in the CMS, stored in src/_data/linkedin.yml.\n` +
        `  It needs the address of a single post, not the company page. Open ` +
        `the post, use the three dots in its corner, choose "Copy link to ` +
        `post", and paste the whole thing. A working address contains either ` +
        `"-activity-" followed by a long number, or "urn:li:activity:".`
      );
    }

    return `https://www.linkedin.com/embed/feed/update/urn:li:${found[1]}:${found[2]}`;
  });

  // Insights collection (blog posts from src/insights/)
  eleventyConfig.addCollection("insights", collection =>
    collection.getFilteredByGlob("src/insights/**/*.md").sort((a, b) => a.date - b.date)
  );

  // Non-pinned insights (newest first)
  eleventyConfig.addCollection("insightsRegular", collection =>
    collection.getFilteredByGlob("src/insights/**/*.md")
      .filter(item => !item.data.pinned)
      .sort((a, b) => b.date - a.date)
  );

  // Pinned insights (at bottom)
  eleventyConfig.addCollection("insightsPinned", collection =>
    collection.getFilteredByGlob("src/insights/**/*.md")
      .filter(item => item.data.pinned)
      .sort((a, b) => a.date - b.date)
  );

  /* Newest few, for the quiet strip on the home page. Pinned articles are not
     news, so they are not eligible: the strip says what happened recently. */
  eleventyConfig.addCollection("insightsLatest", collection =>
    collection.getFilteredByGlob("src/insights/**/*.md")
      .filter(i => !i.data.pinned)
      .sort((a, b) => b.date - a.date)
      .slice(0, 3)
  );

  /*
   * Tag archives, but only for tags that have earned one.
   *
   * A page per tag sounds free and is not. Three articles currently carry 14
   * distinct tags, every one of them used exactly once, so a page per tag would
   * mean 14 pages each listing a single article. Search engines treat that as
   * thin content and it competes with the articles it is supposed to help. The
   * old WordPress site had 90 tag URLs across 16 articles for exactly this
   * reason, and all 90 now redirect to the Insights index.
   *
   * So a tag gets a page once TAG_PAGE_MIN articles share it. Below that the tag
   * still shows on the article, it just is not a link. Raise the threshold if
   * the archive grows and the pages still feel thin.
   */
  const TAG_PAGE_MIN = 3;

  eleventyConfig.addFilter("tagSlug", tag =>
    String(tag).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );

  eleventyConfig.addCollection("tagPages", collection => {
    const posts = collection.getFilteredByGlob("src/insights/**/*.md");
    const byTag = new Map();
    for (const post of posts) {
      for (const tag of post.data.tags || []) {
        if (!byTag.has(tag)) byTag.set(tag, []);
        byTag.get(tag).push(post);
      }
    }
    return [...byTag.entries()]
      .filter(([, items]) => items.length >= TAG_PAGE_MIN)
      .map(([tag, items]) => ({
        tag,
        slug: tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        posts: items.sort((a, b) => b.date - a.date),
      }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  });

  /* Which tags currently have a page, so an article can link only those. */
  eleventyConfig.addCollection("tagsWithPages", collection => {
    const counts = new Map();
    for (const post of collection.getFilteredByGlob("src/insights/**/*.md")) {
      for (const tag of post.data.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return [...counts.entries()].filter(([, n]) => n >= TAG_PAGE_MIN).map(([tag]) => tag);
  });

  // SKIP_ASSETS=1 builds HTML only (fast local previews). CI never sets it.
  if (process.env.SKIP_ASSETS !== "1") {
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("src/admin");
    // The custom domain. GitHub Pages reads CNAME from the published branch
    // and forgets the domain on any deploy that lacks it, so it has to be in
    // the build output, not just in the repository settings.
    eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  }
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.ignores.add("src/pages/home.njk");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    pathPrefix: prefix,
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
