// SEO Description Generator — the interesting part is not the writer (a plain template here) but the gates
// around it: SEO range validation and a factuality check that blocks any number+unit not in the source data.
// Port of the six pipeline stages the original JS implements. Deterministic, no LLM, no network.
import { h, chip, stepper, inView } from './_kit.js';

const SRC = { brand: 'ZenithWear', category: 'Footwear', features: ['Breathable mesh upper', 'Cushioned midsole'],
  specs: { Weight: '250g', Material: 'Mesh/EVA' }, audience: 'long-distance runners', kw: ['running shoes'] };
const NAMES = ['Drift 271', 'Drift 271 Ultra Distance Trainer Edition'];
const TONES = ['PROFESSIONAL', 'CASUAL', 'PLAYFUL', 'LUXURY'];
const STOP = new Set('a an the for with and or of to in on is are'.split(' '));
const tok = t => (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter(x => x.length >= 3 && !STOP.has(x));
const slugify = t => t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
const NUM = /\b\d+(\.\d+)?\s?(kg|g|mm|cm|m|l|ml|w|kw|mah|gb|tb|hrs?|hours?|%|inch(es)?|lbs?)\b/gi;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function run(name, tone, inject) {
  const { brand, category, features: F, specs, audience, kw } = SRC;
  const f1 = F[0], f2 = F[1], full = brand + ' ' + name;
  // stage 2: keywords with provenance
  const kws = kw.map(k => [k, 'provided']);
  const seen = new Set(kw);
  const add = (k, why) => { if (k && !seen.has(k)) { seen.add(k); kws.push([k, why]); } };
  add(category.toLowerCase(), 'category'); add(brand.toLowerCase(), 'brand'); add((brand + ' ' + category).toLowerCase(), 'brand + category');
  F.forEach(f => tok(f).slice(0, 2).forEach(t => add(t, 'feature token')));
  // stage 3: templates
  const T = {
    PROFESSIONAL: [full + ' – ' + f1, 'Shop the ' + full + ', featuring ' + f1 + '. Designed for ' + audience + '. ' + f2 + '. Order today.', full + ' delivers ' + f1 + ' for ' + audience + ', engineered for reliable everyday performance.'],
    CASUAL: [full + ': ' + f1, 'Meet the ' + full + ' — ' + f1 + ', made for ' + audience + '. ' + f2 + '.', 'Meet the ' + full + ' — ' + f1 + ' that just gets it done for ' + audience + '.'],
    PLAYFUL: [full + ' – ' + f1 + '!', 'Say hello to the ' + full + '! ' + f1 + ' and ready for ' + audience + '. ' + f2 + '.', 'Say hello to the ' + full + '! ' + f1 + ' and ready to have some fun, perfect for ' + audience + '.'],
    LUXURY: [full + ' | ' + f1, 'Introducing the ' + full + ' — where ' + f1 + ' meets uncompromising craftsmanship, curated for ' + audience + '. ' + f2 + '.', 'Introducing the ' + full + ' — where ' + f1 + ' meets uncompromising craftsmanship, curated for ' + audience + '.'],
  }[tone];
  const sk = Object.keys(specs);
  let long = T[2] + '\n\nKey features include ' + F.join(', ') + '.\n\nSpecifications: ' + sk.map(k => k + ': ' + specs[k]).join('; ') + '.\n\nThe ' + full + ' is built for ' + audience + ' who expect ' + category.toLowerCase() + ' that performs.';
  if (inject) long += '\n\nWeighs just 500g for effortless miles.';
  const c = { title: T[0], metaTitle: full, meta: T[1], short: T[2], long, bullets: F.map(f => f + ' — built into every ' + name + '.'), slug: slugify(full) };
  // stage 4: validation
  const seo = [];
  const rng = (field, v, a, b) => { if (v.length < a) seo.push({ field, sev: 'WARNING', msg: field + ' is ' + v.length + ' characters, below the recommended minimum of ' + a + '.' }); else if (v.length > b) seo.push({ field, sev: 'WARNING', msg: field + ' is ' + v.length + ' characters, above the recommended maximum of ' + b + '.' }); };
  rng('seoTitle', c.title, 30, 60); rng('metaTitle', c.metaTitle, 10, 60); rng('metaDescription', c.meta, 120, 160);
  if (!SLUG.test(c.slug)) seo.push({ field: 'urlSlug', sev: 'ERROR', msg: 'Slug must be lowercase letters, digits and hyphens only.' });
  if (!kws.some(([k]) => c.title.toLowerCase().includes(k.toLowerCase()))) seo.push({ field: 'seoTitle', sev: 'WARNING', msg: 'No suggested keyword appears in the SEO title.' });
  // stage 5: factuality
  const truth = (F.join(' ') + ' ' + Object.values(specs).join(' ')).toLowerCase();
  const claims = []; const fact = [];
  const scan = (field, text) => { const re = new RegExp(NUM); let m; while ((m = re.exec(text))) { const cl = m[0].trim(); const ok = truth.includes(cl.toLowerCase()); claims.push({ field, cl, ok }); if (!ok) fact.push({ field, msg: '"' + cl + '" is not in the supplied features or specifications.' }); } };
  scan('longDescription', c.long); scan('metaDescription', c.meta); c.bullets.forEach(b => scan('featureBullets', b));
  scan('faqItems', specs.Weight + '.'); scan('faqItems', specs.Material + '.');
  // stage 6: score
  let total = 100; const lines = ['Starting score: 100'];
  seo.forEach(i => { const p = i.sev === 'ERROR' ? 8 : 4; total -= p; lines.push('−' + p + '  SEO ' + i.sev + ' · ' + i.field); });
  fact.forEach(i => { total -= 15; lines.push('−15  Factuality ERROR · ' + i.field); });
  const score = Math.max(0, Math.min(100, total)); lines.push('Final score: ' + score);
  return { c, kws, seo, fact, claims, truth: F.concat(Object.values(specs)), score, lines, F };
}

const CSS = `.sg-out{border:1px solid var(--line);border-radius:var(--r);background:var(--bg);padding:9px 12px;margin-bottom:8px}
.sg-out b{display:block;font:500 .68rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-bottom:3px}
.sg-out div{font-size:.88rem;overflow-wrap:anywhere;white-space:pre-line}.sg-out mark{background:rgba(239,143,143,.2);color:var(--red);padding:0 3px;border-radius:3px}
.sg-seg{display:flex;flex-wrap:wrap;gap:6px}.sg-seg button[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#06121e}
.sg-rng{position:relative;height:12px;border-radius:99px;background:var(--surface2);margin:6px 0 4px}
.sg-rng i{position:absolute;top:0;bottom:0;background:rgba(98,196,142,.35);border-radius:99px}
.sg-rng u{position:absolute;top:-3px;width:4px;height:18px;border-radius:2px;background:var(--text);transform:translateX(-2px)}
.sg-rng.bad u{background:var(--red)}.sg-iss{font:.8rem/1.5 var(--mono);margin:4px 0;overflow-wrap:anywhere}
.sg-iss.ERROR{color:var(--red)}.sg-iss.WARNING{color:var(--amber-lt)}
.sg-score{font-size:3rem;font-weight:700;letter-spacing:-.04em;line-height:1}`;

export function mount(root) {
  const S = { name: 0, tone: 'PROFESSIONAL', inject: false };
  const panel = h('div.d-card', { style: { marginTop: '4px' } });
  const ctl = h('div');
  let flow;

  const res = () => run(NAMES[S.name], S.tone, S.inject);
  const hl = text => {
    const parts = []; let last = 0; const re = new RegExp(NUM); let m;
    const truth = res().truth.join(' ').toLowerCase();
    while ((m = re.exec(text))) { parts.push(text.slice(last, m.index)); const bad = !truth.includes(m[0].trim().toLowerCase()); parts.push(bad ? h('mark', m[0]) : m[0]); last = m.index + m[0].length; }
    parts.push(text.slice(last)); return parts;
  };
  const out = (l, v) => h('div.sg-out', h('b', l), h('div', v));
  const range = (label, len, a, b, max) => {
    const bad = len < a || len > b;
    return h('div', { style: { marginBottom: '12px' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '.85rem' } }, h('span', label + ' · allowed ' + a + '–' + b), h('span.mono', { style: { color: bad ? 'var(--amber-lt)' : 'var(--green)' } }, len + ' chars ' + (bad ? '⚠' : '✓'))),
      h('div.sg-rng' + (bad ? '.bad' : ''), h('i', { style: { left: a / max * 100 + '%', width: (b - a) / max * 100 + '%' } }), h('u', { style: { left: Math.min(len, max) / max * 100 + '%' } })));
  };

  const views = [
    r => [h('span.d-label', 'Stage 1 · extraction — normalise the input, no inference'),
      h('dl.d-kv', h('dt', 'name'), h('dd', NAMES[S.name]), h('dt', 'brand / category'), h('dd', SRC.brand + ' / ' + SRC.category), h('dt', 'features (deduped)'), h('dd', SRC.features.join(' · ')),
        h('dt', 'primary feature'), h('dd', SRC.features[0]), h('dt', 'specs (ground truth)'), h('dd', 'Weight 250g · Material Mesh/EVA'), h('dt', 'audience'), h('dd', SRC.audience))],
    r => [h('span.d-label', 'Stage 2 · keyword analysis — ' + r.kws.length + ' keywords, each with its source'),
      h('div', r.kws.map(([k, w]) => h('span.tok' + (w === 'provided' ? '.hit' : ''), { title: w }, k, ' ', h('small', { style: { color: 'var(--faint)' } }, '· ' + w))))],
    r => [h('span.d-label', 'Stage 3 · generation — a fixed template per tone, not a model'),
      out('SEO title', r.c.title), out('Meta description', r.c.meta), out('Short description', r.c.short), out('Long description', hl(r.c.long)),
      out('Bullets', r.c.bullets.join('\n')), out('URL slug', '/' + r.c.slug)],
    r => [h('span.d-label', 'Stage 4 · SEO validation — lengths and slug are checked, not trusted'),
      range('SEO title', r.c.title.length, 30, 60, 80), range('Meta title', r.c.metaTitle.length, 10, 60, 80), range('Meta description', r.c.meta.length, 120, 160, 200),
      h('div', { style: { marginBottom: '8px' } }, 'Slug ', h('code.mono', '/' + r.c.slug), ' vs ', h('code.mono', '^[a-z0-9]+(-[a-z0-9]+)*$'), ' ', chip(SLUG.test(r.c.slug) ? 'match' : 'fail', SLUG.test(r.c.slug) ? 'ok' : 'bad')),
      r.seo.length ? r.seo.map(i => h('div.sg-iss.' + i.sev, i.sev + ': ' + i.msg)) : h('div.sg-iss', { style: { color: 'var(--green)' } }, 'No SEO issues.')],
    r => [h('span.d-label', 'Stage 5 · factuality gate — every number+unit must exist in the source'),
      h('p', { style: { margin: '0 0 8px', fontSize: '.88rem' } }, 'Source allows: ', r.truth.map(t => h('span.tok.hit', t))),
      h('div.d-scroll', h('table.d-table', h('thead', h('tr', h('th', 'found in'), h('th', 'claim'), h('th', 'verdict'))),
        h('tbody', r.claims.map(c => h('tr', h('td', c.field), h('td.num', c.cl), h('td', chip(c.ok ? 'supported' : 'ERROR · unfounded', c.ok ? 'ok' : 'bad'))))))),
      r.fact.length ? r.fact.map(i => h('div.sg-iss.ERROR', 'ERROR (' + i.field + '): ' + i.msg + ' −15')) : h('p.d-note', 'Nothing unfounded. Try injecting a fabricated “500g” above.')],
    r => [h('span.d-label', 'Stage 6 · quality score = 100 − 8/ERROR − 4/WARNING (SEO) − 15 per factuality issue'),
      h('div', { style: { display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' } },
        h('div.sg-score', { style: { color: r.score >= 90 ? 'var(--green)' : r.score >= 70 ? 'var(--amber-lt)' : 'var(--red)' } }, String(r.score), h('small', { style: { fontSize: '1rem', color: 'var(--muted)' } }, ' /100')),
        h('div', r.lines.map(l => h('div.sg-iss', { style: { color: l.startsWith('−') ? 'var(--red)' : 'var(--muted)' } }, l))))],
  ];

  function show(i) {
    const r = res();
    panel.replaceChildren(h('div', views[i](r)));
    verdict.replaceChildren(chip('score ' + r.score, r.score >= 90 ? 'ok' : r.score >= 70 ? 'warn' : 'bad'), ' ', r.fact.length ? chip('factuality gate: BLOCKED', 'bad') : chip('factuality gate: pass', 'ok'),
      ' ', chip(r.seo.length + ' SEO warning' + (r.seo.length === 1 ? '' : 's'), r.seo.length ? 'warn' : 'ok'));
  }
  const verdict = h('div', { style: { margin: '10px 0' } });

  function controls() {
    ctl.replaceChildren(
      h('div.d-field', h('label', { for: 'sg-name' }, 'Product name'),
        h('select', { id: 'sg-name', onchange: e => { S.name = +e.target.value; show(flow.index); } }, NAMES.map((n, i) => h('option', { value: i, selected: i === S.name }, n)))),
      h('span.d-label', 'Tone (4 templates)'),
      h('div.sg-seg', { role: 'group', 'aria-label': 'Tone' }, TONES.map(t => h('button.d-btn', { type: 'button', 'aria-pressed': String(S.tone === t), onclick: () => { S.tone = t; controls(); show(flow.index); } }, t[0] + t.slice(1).toLowerCase()))),
      h('div.d-ctl', h('button.d-btn' + (S.inject ? '.pri' : ''), { type: 'button', 'aria-pressed': String(S.inject), onclick: () => { S.inject = !S.inject; controls(); if (S.inject) flow.go(4); else show(flow.index); } },
        S.inject ? 'Remove fabricated “500g”' : 'Inject a fabricated “500g” into the long description')));
  }

  root.append(h('style', CSS),
    h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' } }, chip('Deterministic · no LLM', 'ai'), chip('template writer, real gates', 'info'), chip('Drift 271 · ZenithWear')),
    h('div.d-split', { style: { alignItems: 'start' } }, ctl, h('div', h('span.d-label', 'Live verdict'), verdict)));
  flow = stepper(root, [
    { title: 'Extraction' }, { title: 'Keyword analysis' }, { title: 'Generation', cls: 'ai' }, { title: 'SEO validation' }, { title: 'Factuality check', cls: 'bad' }, { title: 'Quality score' },
  ], show);
  root.append(panel, h('p.d-note', 'The original header says “seven-stage”; its JS port implements these six. In production the Generation stage is where an LLM would sit, and stages 4–6 are what would catch its mistakes. Here nothing is generated by a model.'));
  controls(); show(0);
  inView(root, null);
}
