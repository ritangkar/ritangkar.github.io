// Product SEO Score Calculator — a transparent six-part score with fixed weights and fixed penalties.
// Rules ported from the original (SeoScoringRules). Deterministic, no LLM, no network.
import { h, chip, inView } from './_kit.js';

const W = { Title: 20, Description: 15, Metadata: 15, 'Attribute Coverage': 15, 'Keyword Coverage': 20, URL: 15 };
const KW = ['running shoe', 'long distance', 'cushioned'];
const DESC = 'The ZenithWear Drift 271 is a lightweight running shoe built for long-distance comfort. Featuring a breathable mesh upper and cushioned midsole, it keeps your feet supported mile after mile.';
const META_T = 'ZenithWear Drift 271 Running Shoe';
const META_D = 'Shop the ZenithWear Drift 271 running shoe with breathable mesh upper and cushioned midsole, built for long-distance comfort and everyday training.';
const FILL = ' Free delivery across India and easy 30 day returns on every order placed today.';
const TITLES = [
  ['ZenithWear Drift 271 Running Shoe - Long Distance Comfort', 'Sample title'],
  ['Drift 271 Shoe', 'Too short'],
  ['ZenithWear Drift 271 Lightweight Trainer for Everyday Miles', 'No keyword in title'],
  ['ZenithWear Drift 271 Running Shoe - Long Distance Comfort Cushioned Trainer for Road and Trail', 'Too long'],
];
const SLUGS = [['zenithwear-drift-271-running-shoe', 'Clean, with keyword'], ['zenithwear-drift-271', 'Clean, no keyword'], ['ZenithWear_Drift 271', 'Not a slug']];
const ATTRS = [['color', 'Black'], ['material', 'Mesh/EVA'], ['weight', '250g'], ['size', '9 UK']];
const has = (t, k) => t.toLowerCase().includes(k.toLowerCase());
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function calc(i) {
  const L = [];
  const sc = (dim, base, ...pen) => { let s = base; const is = []; pen.forEach(([cond, p, msg]) => { if (cond) { s -= p; is.push('−' + p + '  ' + msg); } }); L.push({ dim, score: Math.max(0, s), is }); };
  const tl = i.title.length;
  sc('Title', 100, [tl < 30, 25, 'title is ' + tl + ' chars (min 30)'], [tl > 60, 15, 'title is ' + tl + ' chars (max 60)'], [!KW.some(k => has(i.title, k)), 30, 'no target keyword in title']);
  const dl = i.desc.length, matched = KW.filter(k => has(i.desc, k)).length;
  sc('Description', 100, [dl < 80, 30, 'description under 80 chars'], [dl > 320, 10, 'description over 320 chars'], [matched / KW.length < .5, 20, 'only ' + matched + '/3 keywords in description']);
  const mt = i.metaT.length, md = i.metaD.length;
  sc('Metadata', 100, [mt < 10 || mt > 60, 15, 'meta title ' + mt + ' chars, outside 10–60'], [md < 120 || md > 160, 15, 'meta description ' + md + ' chars, outside 120–160']);
  const miss = ATTRS.filter(([k]) => !i.attrs[k]).map(a => a[0]);
  L.push({ dim: 'Attribute Coverage', score: Math.round(100 * (4 - miss.length) / 4), is: miss.map(k => '−25  missing attribute: ' + k) });
  const comb = (i.title + ' ' + i.desc + ' ' + ATTRS.filter(([k]) => i.attrs[k]).map(a => a[1]).join(' ')).toLowerCase();
  const found = KW.filter(k => comb.includes(k));
  L.push({ dim: 'Keyword Coverage', score: Math.round(100 * found.length / KW.length), is: KW.filter(k => !comb.includes(k)).map(k => 'keyword not found anywhere: “' + k + '”') });
  sc('URL', 100, [!SLUG_RE.test(i.slug), 40, 'slug is not lowercase-hyphenated'], [i.slug.length > 60, 15, 'slug over 60 chars'], [!KW.some(k => i.slug.toLowerCase().includes(k.replace(/ /g, '-'))), 20, 'no target keyword in slug']);
  const sum = L.reduce((a, r) => a + r.score * W[r.dim] / 100, 0);
  return { L, overall: Math.round(sum), sum };
}

const CSS = `.sc-big{font-size:3.6rem;font-weight:700;letter-spacing:-.04em;line-height:1}
.sc-row{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:10px 12px;margin-bottom:8px}
.sc-row .top{display:flex;justify-content:space-between;gap:10px;font-size:.9rem;font-weight:600}.sc-row .top span:last-child{font:.8rem var(--mono);color:var(--muted);font-weight:400;text-align:right}
.sc-row .bar{margin:7px 0 2px}.sc-is{font:.76rem/1.5 var(--mono);color:var(--amber-lt);margin-top:3px;overflow-wrap:anywhere}
.sc-ctl{display:grid;gap:4px;margin-bottom:14px;min-width:0}.d-split>*{min-width:0}.sc-ctl>label,.sc-ctl>span{font-size:.82rem;color:var(--muted)}
.sc-ctl select{width:100%;max-width:100%;text-overflow:ellipsis;background:var(--bg);color:var(--text);border:1px solid var(--line2);border-radius:8px;padding:9px 11px;font:.9rem var(--sans)}
.sc-ck{display:flex;flex-wrap:wrap;gap:8px}.sc-ck label{display:flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid var(--line2);border-radius:8px;font:.82rem var(--mono);cursor:pointer;background:var(--surface)}
.sc-ck input{accent-color:var(--blue);width:16px;height:16px}.sc-ck label:focus-within{outline:2px solid var(--amber);outline-offset:2px}
.sc-pv{font:.78rem/1.5 var(--mono);color:var(--faint);margin:2px 0 0;overflow-wrap:anywhere}`;

export function mount(root) {
  const S = { t: 0, sl: 0, md: META_D.length, attrs: { color: 1, material: 1, weight: 1, size: 0 } };
  const res = h('div'), hero = h('div.d-card.hl'), pv = h('p.sc-pv'), mdOut = h('output', { for: 'sc-md' });

  const metaText = n => n <= META_D.length ? META_D.slice(0, n) : (META_D + FILL.repeat(3)).slice(0, n);
  const input = () => ({ title: TITLES[S.t][0], desc: DESC, metaT: META_T, metaD: metaText(S.md), attrs: Object.fromEntries(ATTRS.map(([k]) => [k, S.attrs[k] ? '1' : ''])), slug: SLUGS[S.sl][0] });

  function draw() {
    const r = calc(input());
    const base = calc({ ...input(), title: TITLES[0][0], metaD: META_D, attrs: { color: 1, material: 1, weight: 1, size: '' }, slug: SLUGS[0][0] }).overall;
    const col = r.overall >= 80 ? 'var(--green)' : r.overall >= 50 ? 'var(--amber-lt)' : 'var(--red)';
    const d = r.overall - base;
    hero.replaceChildren(h('div', { style: { display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' } },
      h('div', h('span.d-label', 'Overall'), h('div.sc-big', { style: { color: col }, 'aria-live': 'polite' }, String(r.overall), h('small', { style: { fontSize: '1rem', color: 'var(--muted)' } }, ' /100'))),
      h('div', { style: { flex: '1 1 200px' } }, h('div', chip(d === 0 ? 'matches default sample (96)' : (d > 0 ? '+' : '') + d + ' vs default sample 96', d === 0 ? 'ok' : d < 0 ? 'bad' : 'info')),
        h('p.d-note', { style: { margin: '8px 0 0', fontFamily: 'var(--mono)' } }, 'Σ score × weight = ' + r.sum.toFixed(2) + ' → ' + r.overall))));
    res.replaceChildren(...r.L.map(x => h('div.sc-row', h('div.top', h('span', x.dim + ' · ' + W[x.dim] + '%'), h('span', x.score + ' × ' + W[x.dim] + '% = ' + (x.score * W[x.dim] / 100).toFixed(1))),
      h('div.bar.' + (x.score >= 80 ? 'green' : x.score >= 50 ? 'amber' : 'red') + '.is-in', { style: { '--w': x.score + '%' } }, h('i')),
      x.is.map(m => h('div.sc-is', m)))));
    const md = metaText(S.md).length;
    mdOut.textContent = md + ' chars ' + (md >= 120 && md <= 160 ? '· in range' : '· out of 120–160');
    pv.textContent = 'title: ' + TITLES[S.t][0].length + ' chars · slug: /' + SLUGS[S.sl][0];
  }

  const sel = (id, label, opts, key) => h('div.sc-ctl', h('label', { for: id }, label),
    h('select', { id, onchange: e => { S[key] = +e.target.value; draw(); } }, opts.map((o, i) => h('option', { value: i, selected: i === S[key] }, o[1] + ' (' + o[0].length + ' chars)'))));

  root.append(h('style', CSS),
    h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' } }, chip('Deterministic · no LLM', 'ai'), chip('weights 20 / 15 / 15 / 15 / 20 / 15', 'info'), chip('same input, same score, always')),
    hero,
    h('div.d-split', { style: { marginTop: '16px', alignItems: 'start' } },
      h('div', h('span.d-label', 'Edit the sample · scores recompute'),
        sel('sc-t', 'Title variant', TITLES, 't'),
        h('div.sc-ctl', h('label', { for: 'sc-md' }, 'Meta description length'),
          h('input', { id: 'sc-md', type: 'range', min: 60, max: 200, step: 1, value: S.md, style: { width: '100%', accentColor: 'var(--blue)' }, oninput: e => { S.md = +e.target.value; draw(); } }), mdOut),
        h('div.sc-ctl', h('span', 'Attributes present (size is missing in the sample)'),
          h('div.sc-ck', ATTRS.map(([k]) => h('label', h('input', { type: 'checkbox', checked: !!S.attrs[k], onchange: e => { S.attrs[k] = e.target.checked ? 1 : 0; draw(); } }), k)))),
        sel('sc-sl', 'URL slug', SLUGS, 'sl'), pv,
        h('p.d-note', 'Penalties used: title <30 −25 / >60 −15, no keyword −30; meta out of range −15 each; slug not hyphenated −40, no keyword −20; each missing attribute −25.')),
      h('div', h('span.d-label', 'Six sub-scores'), res)));
  draw();
  inView(root, null);
}
