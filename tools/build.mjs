// Generates lab/index.html, lab/<slug>/index.html and sitemap.xml from data/projects.mjs.
// Run: node tools/build.mjs   (output is committed; GitHub Pages serves it as-is — no CI build.)
import { writeFileSync, mkdirSync } from 'node:fs';
import { projects, clusters, tiers, kinds, owner } from '../data/projects.mjs';

const SITE = 'https://ritangkar.github.io';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (path, html) => { if (path.includes('/')) mkdirSync(path.replace(/\/[^/]*$/, ''), { recursive: true }); writeFileSync(path, html); };

export const header = (cur = '') => `<a class="skip" href="#main">Skip to content</a>
<header class="hdr"><div class="wrap">
  <a class="brand" href="/" aria-label="Ritangkar Dey — home"><i aria-hidden="true">RD</i><span>Ritangkar Dey</span></a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
  <nav class="nav" id="nav" aria-label="Primary">
    <a href="/#experience">Experience</a><a href="/#architecture">Architecture</a><a href="/#ai">AI</a>
    <a href="/lab/"${cur === 'lab' ? ' aria-current="page"' : ''}>Lab</a><a href="/#skills">Skills</a>
    <a href="/assets/Ritangkar-Dey-Resume.pdf" target="_blank" rel="noopener">Résumé</a>
    <a class="cta" href="/#contact">Contact</a>
  </nav>
</div></header>`;

export const footer = () => `<footer><div class="wrap">
  <span>© 2026 Ritangkar Dey · Enterprise commerce · Architecture · AI</span>
  <span><a href="https://www.linkedin.com/in/ritangkar-dey" rel="noopener">LinkedIn</a> · <a href="https://github.com/ritangkar" rel="noopener">GitHub</a> · <a href="mailto:ritangkardey11@gmail.com">Email</a></span>
</div></footer>`;

const head = ({ title, desc, path, extra = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}">
<meta name="theme-color" content="#0a0c10">
<meta name="author" content="Ritangkar Dey">
<meta property="og:type" content="website"><meta property="og:site_name" content="Ritangkar Dey">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${path}"><meta property="og:image" content="${SITE}/assets/og-image.png">
<meta property="og:image:alt" content="Ritangkar Dey — AI-First Enterprise Commerce Architect">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}/assets/og-image.png">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
${extra}</head>`;

const kindChip = k => `<span class="chip ${kinds[k].cls}">${kinds[k].label}</span>`;
const card = p => `<a class="card${p.tier === 'flagship' ? ' flag' : ''}" href="/lab/${p.slug}/" data-cluster="${p.cluster}" data-tier="${p.tier}">
  <div class="top">${kindChip(p.kind)}<span class="chip">${clusters[p.cluster].label}</span></div>
  <h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p>
  <div class="sig">${esc(p.sig)}</div>
  <div class="foot"><span class="go">Open demo →</span></div></a>`;

// ---------- Lab index ----------
const tierBlocks = Object.entries(tiers).map(([t, meta]) => {
  const list = projects.filter(p => p.tier === t);
  return `<div class="tier-block" data-tier-block="${t}"><div class="tier"><h2>${meta.label}</h2><p>${esc(meta.blurb)}</p></div>
  <div class="grid ${t === 'flagship' ? 'g2' : 'g3'}">${list.map(card).join('\n')}</div></div>`;
}).join('\n');
const chips = ['<button type="button" data-f="all" aria-pressed="true">All 17</button>',
  ...Object.entries(clusters).map(([k, c]) => `<button type="button" data-f="${k}" aria-pressed="false">${c.label}</button>`)].join('');

write('lab/index.html', `${head({
  title: 'Engineering Lab — 17 commerce & AI engineering projects | Ritangkar Dey',
  desc: 'Seventeen engineering projects behind the architecture: BM25 search, hybrid recommendation, revenue root-cause analysis, a research agent, API performance and security — each with an interactive demo.',
  path: '/lab/' })}
<body>
${header('lab')}
<main id="main">
<div class="wrap">
  <div class="ph"><div class="crumb"><a href="/">Home</a> / Lab</div>
    <span class="eyebrow">Engineering Lab</span>
    <h1>Seventeen projects. One way of thinking.</h1>
    <p class="lede">Small, focused systems I built to understand commerce problems from first principles — ranking, recommendation, root-cause analysis, grounding, performance and security. Each has an interactive demo with hard-coded, synthetic data; the code is on GitHub.</p>
  </div>
  <div class="filters" role="group" aria-label="Filter projects by theme">${chips}</div>
  <p class="sr" id="filter-status" role="status" aria-live="polite"></p>
  ${tierBlocks}
  <p class="honest" style="margin-top:48px"><b>Reading this honestly:</b> most of these are deliberately deterministic — rules, statistics and classical algorithms. Only the churn model is machine learning, and no demo calls an LLM. The “LLM-ready” projects show the grounding and validation layers an LLM would sit behind.</p>
</div></main>
${footer()}
<script src="/assets/js/site.js" defer></script><script src="/assets/js/lab.js" defer></script>
</body></html>`);

// ---------- Project pages ----------
projects.forEach((p, i) => {
  const prev = projects[(i + projects.length - 1) % projects.length], next = projects[(i + 1) % projects.length];
  const ld = { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: p.name, description: p.tagline,
    codeRepositoryUrl: owner + p.slug, author: { '@type': 'Person', name: 'Ritangkar Dey' } };
  write(`lab/${p.slug}/index.html`, `${head({
    title: `${p.name} — Engineering Lab | Ritangkar Dey`, desc: p.tagline, path: `/lab/${p.slug}/`,
    extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n` })}
<body>
${header('lab')}
<main id="main"><div class="wrap">
  <div class="ph"><div class="crumb"><a href="/">Home</a> / <a href="/lab/">Lab</a> / ${esc(p.name)}</div>
    <span class="eyebrow">${clusters[p.cluster].label}</span>
    <h1>${esc(p.name)}</h1>
    <p class="lede">${esc(p.tagline)}</p>
    <div class="meta">${kindChip(p.kind)}<span class="chip">${tiers[p.tier].label}</span>${p.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
    <div class="meta" style="margin-top:20px"><a class="btn pri sm" href="${owner}${p.slug}" rel="noopener">View code on GitHub ↗</a><a class="btn sm" href="/lab/">All projects</a></div>
  </div>
  <div class="demo-frame"><div class="demo-bar"><span>INTERACTIVE DEMO</span><span>hard-coded · synthetic data · runs in your browser</span></div>
    <div class="demo" data-demo="${p.slug}"><noscript><p class="muted">The interactive demo needs JavaScript. The write-up below covers the same material.</p></noscript></div></div>
  <div class="prose">
    <div class="card"><h2>The problem</h2><p>${esc(p.problem)}</p></div>
    <div class="card"><h2>How it works</h2><ol>${p.how.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
    <div class="card"><h2>Technically interesting</h2><p>${esc(p.interesting)}</p></div>
    <div class="card"><h2>Why it matters</h2><p>${esc(p.matters)}</p></div>
  </div>
  <p class="honest"><b>Scope &amp; honesty.</b> ${esc(p.honest)}</p>
  <div class="meta"><a class="btn pri" href="${owner}${p.slug}" rel="noopener">Read the code ↗</a></div>
  <p class="byline">Built by Ritangkar Dey · <a href="/assets/Ritangkar-Dey-Resume.pdf" target="_blank" rel="noopener">Résumé</a> · <a href="https://www.linkedin.com/in/ritangkar-dey" rel="noopener">LinkedIn</a> · <a href="https://github.com/ritangkar" rel="noopener">GitHub</a> · <a href="mailto:ritangkardey11@gmail.com">Email</a></p>
  <nav class="pn" aria-label="More projects"><a href="/lab/${prev.slug}/">← ${esc(prev.name)}</a><a href="/lab/${next.slug}/">${esc(next.name)} →</a></nav>
</div></main>
${footer()}
<script src="/assets/js/site.js" defer></script><script src="/assets/js/lab.js" defer></script>
</body></html>`);
});

// ---------- Home (from template) ----------
import { readFileSync } from 'node:fs';
const ld = { '@context': 'https://schema.org', '@type': 'Person', name: 'Ritangkar Dey', url: SITE + '/',
  jobTitle: 'AI-First Enterprise Commerce Architect', description: 'SAP Commerce technical lead and solution architect with 8+ years across B2B, B2C and B2B2C commerce, enterprise integration, performance engineering and applied AI.',
  sameAs: ['https://www.linkedin.com/in/ritangkar-dey', 'https://github.com/ritangkar'], address: { '@type': 'PostalAddress', addressLocality: 'Kolkata', addressCountry: 'IN' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'KIIT University' }, knowsAbout: ['SAP Commerce', 'Enterprise commerce architecture', 'SAP S/4HANA', 'SAP CPI', 'Java', 'Spring', 'Applied AI'] };
const home = readFileSync('tools/home.template.html', 'utf8')
  .replace('{{HEAD}}', head({ title: 'Ritangkar Dey — AI-First Enterprise Commerce Architect',
    desc: 'SAP Commerce technical lead and solution architect with 8+ years across B2B, B2C and B2B2C commerce — enterprise integration, performance, security and applied AI. Explore 17 engineering projects with interactive demos.',
    path: '/', extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n` }))
  .replace('{{HEADER}}', header()).replace('{{FOOTER}}', footer())
  .replace('{{FLAGSHIP_CARDS}}', projects.filter(p => p.tier === 'flagship').map(card).join('\n'))
  .replace('{{OTHER_LINKS}}', projects.filter(p => p.tier !== 'flagship').map(p => `<a href="/lab/${p.slug}/">${esc(p.name)}</a>`).join(' · '));
write('index.html', home);

// ---------- sitemap ----------
const urls = ['/', '/lab/', ...projects.map(p => `/lab/${p.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u, i) => `  <url><loc>${SITE}${u}</loc><priority>${i === 0 ? '1.0' : i === 1 ? '0.8' : '0.6'}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log('built', urls.length, 'urls');
