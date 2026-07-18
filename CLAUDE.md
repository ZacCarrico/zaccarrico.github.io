# Repo guide for Claude

Personal site at https://zaccarrico.github.io. Plain static files served by
GitHub Pages from the `master` branch. Pushing to `master` auto-deploys within a
minute or two. There is no server-side build on GitHub's end; the only build is
the local blog generator described below.

The homepage (`index.html` + `script.js` + `style.css`) is a client-rendered
single-page app with a Blade Runner theme. Content sections live in `index.html`
and are shown/hidden by hash routing in `script.js`.

## Blog posts and the build step

Post text is Markdown in `blog/*.md`. The list of published posts is the
`blogPosts` array in `script.js`, which is the single source of truth. A Markdown
file that is not in that array is not published (for example
`blog/messaging_systems.md`).

Because the SPA renders posts in JavaScript, crawlers and AI agents that do not
run JS would otherwise see an empty blog. So `tools/generate-blog.mjs`
pre-renders each post into a static, crawlable page and keeps the discoverability
files in sync. It generates, from the `blogPosts` array:

- `blog/<slug>.html`, one static page per post, with canonical link, Open Graph
  and Twitter tags, and `BlogPosting` JSON-LD. Slug and meta description are
  derived automatically (description is the first paragraph, truncated).
- `sitemap.xml`
- `llms.txt`
- the `<noscript>` link list inside `index.html`, between the
  `BLOG_STATIC_LINKS_START` / `BLOG_STATIC_LINKS_END` markers.

Do not hand-edit those generated outputs. Edit the source (`blog/*.md` and the
`blogPosts` array), then regenerate.

### To add or change a post

1. Add or edit the Markdown in `blog/`.
2. Update the `blogPosts` array in `script.js`.
3. Run the build:

   ```
   npm install   # first run only
   npm run build
   ```

4. Stage the source and every generated file the build touched, by explicit path:
   the `.md`, `script.js`, the new or changed `blog/<slug>.html`, `sitemap.xml`,
   `llms.txt`, and `index.html`. The build is idempotent, so re-running it should
   not produce churn.

## Keeping the site crawlable

Any change here should keep the site queryable by search engines and AI agents:

- Keep `robots.txt` allowing crawlers (including the named AI crawlers) and
  pointing to `sitemap.xml`.
- Keep the per-post and site-level JSON-LD valid. After edits, confirm every
  `application/ld+json` block still parses.
- If you restructure `index.html`, keep the `BLOG_STATIC_LINKS` markers so the
  generator can still inject the noscript links.

## Verifying the rendered SPA did not change

Changes to `index.html`, `style.css`, or `script.js` can affect appearance. The
SEO work in this repo was verified to be pixel-identical with a before/after
screenshot diff. To repeat that: serve the site locally
(`python3 -m http.server`), drive headless Chromium (Playwright) over the home,
about, and blog sections at desktop and mobile viewports, and diff the images.
Freeze the glitch animation and the mouse parallax first (inject
`* { animation: none !important; transition: none !important }` and hide
`.custom-cursor`), otherwise the diff shows animation noise. Capture the baseline
before editing.

## After pushing

GitHub Pages redeploys automatically. Confirm the live URLs resolve (the
homepage, `sitemap.xml`, `robots.txt`, `llms.txt`, and a post page) and that a
post page serves its baked content rather than an empty shell.

Getting Google to index the new pages needs a step Claude cannot do: submitting
`sitemap.xml` in Google Search Console requires Zac's authenticated Search
Console account. Remind Zac to do it rather than attempting it; the old anonymous
sitemap ping endpoints are deprecated.

The repo root holds a Google Search Console verification file
(`google<hash>.html`). It must stay committed and served at the site root; do not
delete it or Google loses ownership verification for the property.

## Git

Follow the global staging rule: stage each intended file by explicit path, never
`git add -A` / `.` / `-a`. `node_modules/` is gitignored; `package-lock.json` is
committed.
