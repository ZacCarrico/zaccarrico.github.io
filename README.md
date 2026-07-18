# zaccarrico.github.io

Personal site. Plain static files served by GitHub Pages. The homepage
(`index.html` + `script.js` + `style.css`) is a client-rendered single-page app
with a Blade Runner theme.

## Blog posts

Posts are written as Markdown in `blog/` and listed in the `blogPosts` array in
`script.js`, which the SPA renders at runtime.

Because that rendering happens in JavaScript, a build step also pre-renders each
post into a static, crawlable HTML page so search engines and AI agents that do
not run JavaScript can read the full text. The build also writes `sitemap.xml`,
`llms.txt`, and the `<noscript>` link list inside `index.html`.

### Adding or editing a post

1. Add the Markdown file to `blog/`.
2. Add an entry to the `blogPosts` array in `script.js` (this is the single
   source of truth for the post list).
3. Run the build:

   ```
   npm install   # first time only
   npm run build
   ```

4. Commit the Markdown file, `script.js`, and everything the build touched:
   the new `blog/<slug>.html`, `sitemap.xml`, `llms.txt`, and `index.html`.

The build (`tools/generate-blog.mjs`) derives each page's slug and meta
description automatically, so there is nothing else to keep in sync.

## Discoverability files

- `robots.txt` — allows all crawlers (including named AI crawlers) and points to
  the sitemap.
- `sitemap.xml` — the homepage plus every post's static page. Generated.
- `llms.txt` — site overview and post index for AI agents. Generated.
- Per-post JSON-LD (`BlogPosting`) and site-level JSON-LD (`Person` + `WebSite`)
  are embedded for structured-data indexing.
