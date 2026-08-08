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
    return d.toLocaleDateString();
  });

  // Per-page SEO lookup from src/_data/seo.yml, keyed by URL
  eleventyConfig.addFilter("seoLookup", (pages, url) =>
    (pages || []).find(p => p.url === url) || {}
  );

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
