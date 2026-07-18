// Pre-renders blog posts into crawlable static HTML, then writes sitemap.xml and
// llms.txt. The site's runtime stays a client-rendered SPA; these static pages
// exist so search engines and AI agents that do not execute JavaScript can read
// the full post text and discover every post by URL.
//
// Source of truth is the `blogPosts` array in script.js, so this never drifts
// from what the site actually lists. Run with `npm run build` after adding a
// post or editing its markdown.
//
// Usage: node tools/generate-blog.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://zaccarrico.github.io';
const AUTHOR = 'Zac Carrico';

// --- read the post list out of script.js (single source of truth) ------------
function loadPosts() {
  const js = readFileSync(join(ROOT, 'script.js'), 'utf8');
  const m = js.match(/const\s+blogPosts\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) throw new Error('Could not find the blogPosts array in script.js');
  // The array is a plain JS literal (unquoted keys, trailing comma). Evaluate it
  // in a throwaway function rather than JSON.parse.
  // eslint-disable-next-line no-new-func
  const posts = Function(`"use strict"; return (${m[1]});`)();
  return posts;
}

// --- helpers ------------------------------------------------------------------
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['".,:;!?()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strip a leading H1 so the page header title is not duplicated in the body.
function stripLeadingH1(md) {
  return md.replace(/^\s*#\s+.*(?:\r?\n)+/, '');
}

// Build a ~155-char plain-text description from the first real paragraph.
function deriveDescription(md) {
  const body = stripLeadingH1(md);
  const blocks = body.split(/\r?\n\r?\n/);
  let text = '';
  for (const b of blocks) {
    const t = b.trim();
    if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('|')) continue;
    text = t;
    break;
  }
  // Strip markdown/HTML noise down to prose.
  text = text
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 158) return text;
  const cut = text.slice(0, 158);
  return cut.slice(0, cut.lastIndexOf(' ')).trim() + '…';
}

// --- per-post HTML page -------------------------------------------------------
function renderPostPage(post, html, description) {
  const url = `${BASE_URL}/blog/${post.slug}.html`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: AUTHOR, url: `${BASE_URL}/` },
    publisher: { '@type': 'Person', name: AUTHOR },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: post.category,
    inLanguage: 'en',
  };
  return `<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>${escapeHtml(post.title)} — ${AUTHOR}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="${AUTHOR}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="${url}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="${AUTHOR}">
  <meta property="article:published_time" content="${post.date}">
  <meta property="article:author" content="${AUTHOR}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

  <!-- Styles: same stack as the main site -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" rel="stylesheet" type="text/css" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Rajdhani:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link href="/style.css" rel="stylesheet" type="text/css" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />

  <style>
    .markdown-content { font-size: 1.4rem; line-height: 1.7; }
    .markdown-content h1 { font-size: 1.9rem; }
    .markdown-content h2 { font-size: 1.6rem; }
    .markdown-content h3 { font-size: 1.4rem; }
    .markdown-content h4 { font-size: 1.2rem; }
    .markdown-content p { margin-bottom: 1.2rem; }
    .markdown-content ul, .markdown-content ol { margin-left: 2rem; padding-left: 1rem; font-size: 1.3rem; }
    .markdown-content ul { list-style-type: disc; list-style-position: outside; }
    .markdown-content ol { list-style-type: decimal; list-style-position: outside; }
    .markdown-content li { display: list-item; margin-bottom: 0.5rem; }
    .post-back { display: inline-block; margin-bottom: 1.5rem; font-family: var(--font-accent); letter-spacing: 1px; }
    .post-wrap { max-width: 900px; margin: 2rem auto; padding: 0 2rem; }
  </style>

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>

<body>
  <div class="parallax" data-speed="10" id="bg-stars"></div>
  <div class="parallax" data-speed="20" id="bg-grid"></div>

  <header id="header">
    <div class="inner">
      <h1 class="glitch-text" data-text="ZAC CARRICO"><a href="/" style="color:inherit;text-decoration:none;">ZAC CARRICO</a></h1>
      <ul class="main-menu">
        <li><a href="/#home">HOME</a></li>
        <li><a href="/#about">ABOUT</a></li>
        <li><a href="/#blog">BLOG</a></li>
        <li><a href="https://github.com/ZacCarrico" target="_blank" rel="noopener">GITHUB</a></li>
        <li><a href="https://www.linkedin.com/in/zachary-carrico/" target="_blank" rel="noopener">LINKEDIN</a></li>
      </ul>
    </div>
  </header>

  <div id="container">
    <div class="post-wrap">
      <a class="post-back" href="/#blog">← All posts</a>
      <article class="blog-post">
        <div class="blog-header">
          <h3>${escapeHtml(post.title)}</h3>
          <div class="blog-meta">
            <span class="blog-date">${escapeHtml(post.date)}</span>
            <span class="blog-category">${escapeHtml(post.category)}</span>
          </div>
        </div>
        <div class="blog-content markdown-content">
${html}
        </div>
      </article>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
</body>

</html>
`;
}

// --- sitemap ------------------------------------------------------------------
function renderSitemap(posts) {
  const urls = [];
  urls.push({ loc: `${BASE_URL}/`, lastmod: posts[0]?.date });
  for (const p of posts) {
    urls.push({ loc: `${BASE_URL}/blog/${p.slug}.html`, lastmod: p.date });
  }
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

// --- llms.txt -----------------------------------------------------------------
function renderLlms(posts) {
  const lines = [];
  lines.push(`# ${AUTHOR}`);
  lines.push('');
  lines.push(
    '> Personal site of Zac Carrico, an AI engineer and scientist in Austin, TX. Writing on machine learning engineering, model training, LLM workflows, and building with AI tools.'
  );
  lines.push('');
  lines.push(
    'The site homepage is a client-rendered single-page app. The pages below are static, fully rendered, and are the canonical readable version of each post.'
  );
  lines.push('');
  lines.push('## Blog posts');
  lines.push('');
  for (const p of posts) {
    lines.push(`- [${p.title}](${BASE_URL}/blog/${p.slug}.html) (${p.date}): ${p.description}`);
  }
  lines.push('');
  lines.push('## About');
  lines.push('');
  lines.push(`- [About Zac Carrico](${BASE_URL}/#about): Background as an AI engineer and scientist.`);
  lines.push('');
  lines.push('## Links');
  lines.push('');
  lines.push('- [GitHub](https://github.com/ZacCarrico)');
  lines.push('- [LinkedIn](https://www.linkedin.com/in/zachary-carrico/)');
  lines.push('');
  return lines.join('\n');
}

// --- main ---------------------------------------------------------------------
function main() {
  marked.setOptions({ gfm: true, breaks: false });
  const posts = loadPosts();

  // Enrich each post with slug + description and render its page.
  for (const post of posts) {
    post.slug = slugify(post.title);
    const md = readFileSync(join(ROOT, 'blog', post.filename), 'utf8');
    post.description = deriveDescription(md);
    const html = marked.parse(stripLeadingH1(md));
    const page = renderPostPage(post, html, post.description);
    writeFileSync(join(ROOT, 'blog', `${post.slug}.html`), page);
    console.log(`wrote blog/${post.slug}.html`);
  }

  writeFileSync(join(ROOT, 'sitemap.xml'), renderSitemap(posts));
  console.log('wrote sitemap.xml');

  writeFileSync(join(ROOT, 'llms.txt'), renderLlms(posts));
  console.log('wrote llms.txt');

  // Emit the <noscript> discovery block for index.html between its markers.
  const navItems = posts
    .map((p) => `        <li><a href="/blog/${p.slug}.html">${escapeHtml(p.title)}</a></li>`)
    .join('\n');
  const block = `<!-- BLOG_STATIC_LINKS_START (generated by tools/generate-blog.mjs) -->
      <ul class="blog-nav-list">
${navItems}
      </ul>
      <!-- BLOG_STATIC_LINKS_END -->`;
  injectIntoIndex(block);
  console.log('updated index.html noscript links');
}

// Replace the content between the BLOG_STATIC_LINKS markers in index.html.
function injectIntoIndex(block) {
  const path = join(ROOT, 'index.html');
  const html = readFileSync(path, 'utf8');
  const re = /<!-- BLOG_STATIC_LINKS_START[\s\S]*?BLOG_STATIC_LINKS_END -->/;
  if (!re.test(html)) {
    throw new Error('index.html is missing the BLOG_STATIC_LINKS markers');
  }
  writeFileSync(path, html.replace(re, block));
}

main();
