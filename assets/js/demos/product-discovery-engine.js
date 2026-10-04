import { h, chip, inView } from './_kit.js';

// Deterministic port of the intent-extraction rules (dictionaries + regex). No LLM, no network.
const CAT = {
  'Footwear': ['footwear', 'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'running shoe'],
  'Apparel': ['apparel', 'jacket', 'shirt', 'tee', 't-shirt', 'tights', 'joggers', 'windbreaker', 'base layer'],
  'Accessories': ['accessories', 'backpack', 'cap', 'gloves', 'bottle', 'pack', 'visor'],
  'Outdoor Gear': ['outdoor gear', 'tent', 'sleeping bag', 'trekking pole', 'poles', 'camp stove', 'stove'],
  'Electronics': ['electronics', 'earbuds', 'watch', 'monitor', 'tracker'],
};
const COLORS = ['black', 'white', 'red', 'blue', 'navy', 'grey', 'gray', 'green', 'orange', 'olive', 'brown'];
const USE = [['long-distance running', ['long distance', 'long-distance', 'marathon']], ['trail running', ['trail running', 'trail run']], ['sprint training', ['sprint']],
  ['daily training', ['daily training', 'everyday training']], ['hiking', ['hiking', 'hike', 'trek']], ['camping', ['camping', 'camp']], ['training', ['training', 'gym', 'workout']], ['everyday', ['everyday', 'daily wear', 'casual']]];
const BRANDS = ['AeroFit', 'BaseCamp', 'CoreFit', 'FlexTech', 'GripFit', 'HydroFlow', 'NorthPeak', 'PacePro', 'RapidTread', 'SolarCap', 'SprintFlex', 'StrideMax', 'ThermoLayer', 'TrailBlazer', 'TrailPack', 'TrailRunner', 'ZenithWear'];
const PRESETS = ['black running shoes under 8000 for long distance', 'NorthPeak tent between 5k and 12k for camping', 'navy jacket over 3000', 'shoes between 9000 and 3000', 'something nice'];
const FIELD_STYLE = { category: 'hit', brand: 'hit', color: 'amber', useCase: 'amber', price: 'green' };

function extract(raw) {
  const q = raw.toLowerCase().replace(/,/g, ''), m = [], trace = [], out = { category: null, color: null, brand: null, minPrice: null, maxPrice: null, useCase: null };
  const find = (needle) => q.indexOf(needle);
  let best = 0;
  for (const [cat, kws] of Object.entries(CAT)) for (const kw of kws) { const i = find(kw); if (i >= 0 && kw.length > best) { best = kw.length; out.category = cat; out._c = [i, kw.length, kw]; } }
  if (out.category) { m.push({ f: 'category', s: out._c[0], e: out._c[0] + out._c[1] }); trace.push('category ← matched keyword "' + out._c[2] + '" (longest wins)'); }
  delete out._c;
  for (const c of COLORS) { const r = new RegExp('\\b' + c + '\\b').exec(q); if (r) { out.color = c === 'gray' ? 'Grey' : c[0].toUpperCase() + c.slice(1); m.push({ f: 'color', s: r.index, e: r.index + c.length }); trace.push('color ← "' + c + '"'); break; } }
  for (const b of BRANDS) { const i = q.indexOf(b.toLowerCase()); if (i >= 0) { out.brand = b; m.push({ f: 'brand', s: i, e: i + b.length }); trace.push('brand ← "' + b + '"'); break; } }
  const k = (n, kk) => parseInt(n, 10) * (kk ? 1000 : 1);
  const btw = /between\s*(?:₹|rs\.?|inr)?\s*(\d+)(k)?\s*(?:and|-|to)\s*(?:₹|rs\.?|inr)?\s*(\d+)(k)?/.exec(q);
  if (btw) { out.minPrice = k(btw[1], btw[2]); out.maxPrice = k(btw[3], btw[4]); m.push({ f: 'price', s: btw.index, e: btw.index + btw[0].length }); trace.push('price range ← "' + btw[0] + '"'); }
  else {
    const un = /(?:under|below|less than|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+)(k)?/.exec(q), ov = /(?:over|above|more than)\s*(?:₹|rs\.?|inr)?\s*(\d+)(k)?/.exec(q);
    if (un) { out.maxPrice = k(un[1], un[2]); m.push({ f: 'price', s: un.index, e: un.index + un[0].length }); trace.push('maxPrice ← "' + un[0] + '"'); }
    if (ov) { out.minPrice = k(ov[1], ov[2]); m.push({ f: 'price', s: ov.index, e: ov.index + ov[0].length }); trace.push('minPrice ← "' + ov[0] + '"'); }
  }
  const nq = q.replace(/-/g, ' '); best = 0; let hit = null;
  for (const [uc, ph] of USE) for (const p of ph) { const n = p.replace(/-/g, ' '), i = nq.indexOf(n); if (i >= 0 && n.length > best) { best = n.length; out.useCase = uc; hit = [i, n.length, p]; } }
  if (hit) { m.push({ f: 'useCase', s: hit[0], e: hit[0] + hit[1] }); trace.push('useCase ← phrase "' + hit[2] + '"'); }
  const issues = [];
  if (out.minPrice != null && out.maxPrice != null && out.minPrice > out.maxPrice) issues.push(['ERROR', 'minPrice (' + out.minPrice + ') is greater than maxPrice (' + out.maxPrice + ').']);
  if (!trace.length) issues.push(['WARNING', 'No structured field could be extracted, so this is treated as free-text search only.']);
  return { q, m: m.sort((a, b) => a.s - b.s), out, trace, issues };
}

export function mount(root) {
  const input = h('input', { type: 'text', id: 'pde-q', value: PRESETS[0], autocomplete: 'off', spellcheck: 'false' });
  const presets = h('div.d-ctl', { role: 'group', 'aria-label': 'Example queries' });
  const hl = h('div.d-card'), res = h('div.d-card.hl'), tr = h('div.d-card');
  root.append(
    h('div.d-ctl', chip('Rule-based: dictionaries + regex', 'ok'), chip('No LLM · deterministic', 'info')),
    h('div.d-field', h('label', { for: 'pde-q' }, 'Natural-language query (try the examples or type your own)'), input),
    presets, h('div.d-split', h('div', h('span.d-label', '1 · Tokens recognised'), hl, h('span.d-label', { style: { marginTop: '14px' } }, '3 · extractedFrom trace'), tr), h('div', h('span.d-label', '2 · Structured query'), res)),
    h('p.d-note', 'This is the query-understanding layer that sits in front of the BM25 search engine. The validation step (min > max is an ERROR, nothing extracted is a WARNING) is the same guardrail you would put in front of an LLM extractor.'));

  function draw() {
    const r = extract(input.value);
    presets.replaceChildren(...PRESETS.map(p => h('button.d-btn', { type: 'button', 'aria-pressed': String(p === input.value), onclick: () => { input.value = p; draw(); } }, p.length > 34 ? p.slice(0, 32) + '…' : p)));
    const kids = []; let pos = 0;
    for (const t of r.m) { if (t.s < pos) continue; if (t.s > pos) kids.push(r.q.slice(pos, t.s)); const s = FIELD_STYLE[t.f]; kids.push(h('span.tok' + (s === 'green' ? '' : '.' + s), { style: s === 'green' ? { borderColor: 'var(--green)', color: 'var(--green)' } : null, title: t.f }, r.q.slice(t.s, t.e), h('sub', { style: { fontSize: '.62rem', marginLeft: '4px', opacity: .8 } }, t.f))); pos = t.e; }
    if (pos < r.q.length) kids.push(r.q.slice(pos));
    hl.replaceChildren(h('div', { style: { fontFamily: 'var(--mono)', lineHeight: 2.1, fontSize: '.88rem', overflowWrap: 'anywhere' } }, kids));
    const o = r.out, fields = [['category', o.category], ['color', o.color], ['brand', o.brand], ['minPrice', o.minPrice], ['maxPrice', o.maxPrice], ['useCase', o.useCase]];
    const json = '{\n' + fields.map(([k, v]) => '  "' + k + '": ' + (v == null ? 'null' : typeof v === 'number' ? v : '"' + v + '"')).join(',\n') + '\n}';
    res.replaceChildren(h('div.d-ctl', { style: { marginTop: 0 } }, fields.filter(f => f[1] != null).map(([k, v]) => h('span.chip.info', k + ': ' + (typeof v === 'number' ? '₹' + v.toLocaleString('en-IN') : v)))),
      h('pre.d-code', { style: { whiteSpace: 'pre-wrap' } }, json),
      ...r.issues.map(([sev, msg]) => h('p', { style: { margin: '10px 0 0', fontSize: '.84rem', color: sev === 'ERROR' ? 'var(--red)' : 'var(--amber-lt)' } }, sev + ': ' + msg)));
    tr.replaceChildren(r.trace.length ? h('ul', { style: { margin: 0, paddingLeft: '18px', fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--muted)' } }, r.trace.map(t => h('li', t))) : h('span.d-note', { style: { margin: 0 } }, 'nothing to trace'));
  }
  input.addEventListener('input', draw);
  draw();
  inView(root, null);
}
