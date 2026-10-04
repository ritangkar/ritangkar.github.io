// Catalog Quality Auditor — 7 deterministic checks over a deliberately issue-dense 135-product synthetic catalog.
// Hard-coded values taken from executing the original bundle. No LLM, no network.
import { h, chip, inView, reduced } from './_kit.js';

const P = s => s.split(' ').map(n => 'PR' + n);
// sev: E = ERROR (-1.2 per occurrence), W = WARNING (-0.6 per occurrence)
const CHECKS = [
  { k: 'dup', label: 'Duplicate candidates', sev: 'W', n: 16, rule: 'Same name + same brand on different product ids.',
    ids: P('0074 0073 0066 0065 0071 0072 0067 0068 0062 0061 0070 0069 0075 0076 0063 0064'),
    ex: [['PR0074', 'NorthPeak Outdoor Gear Pro 206', 'twin of PR0073'], ['PR0066', 'AeroFit Apparel Pro 202', 'twin of PR0065'], ['PR0071', 'CoreFit Apparel Pro 205', 'twin of PR0072'], ['PR0062', 'NorthPeak Electronics Pro 200', 'twin of PR0061']] },
  { k: 'mat', label: 'Missing material', sev: 'W', n: 15, rule: 'Material attribute is empty.',
    ids: P('0083 0090 0077 0078 0086 0082 0084 0085 0089 0079 0087 0080 0091 0081 0088'),
    ex: [['PR0083', 'NorthPeak Footwear Lite 306', 'material = ""'], ['PR0090', 'HydroFlow Accessories Lite 313', 'material = ""'], ['PR0077', 'HydroFlow Accessories Lite 300', 'material = ""']] },
  { k: 'desc', label: 'Missing / short description', sev: 'E', n: 12, rule: 'Description blank or shorter than 15 characters.',
    ids: P('0100 0103 0095 0099 0094 0102 0097 0098 0101 0092 0096 0093'),
    ex: [['PR0100', 'AeroFit Apparel Basic 408', 'description = "" (blank)'], ['PR0103', 'HydroFlow Electronics Basic 411', 'description = "Good." (5 chars)'], ['PR0094', 'CoreFit Apparel Basic 402', 'description = "" (blank)']] },
  { k: 'title', label: 'Poor titles', sev: 'W', n: 10, rule: 'Title under 8 chars, ALL CAPS, or a bare generic word.',
    ids: P('0104 0105 0111 0110 0109 0112 0108 0106 0107 0113'),
    ex: [['PR0104', 'Shoe', 'under 8 characters'], ['PR0105', 'PRODUCT 481', 'ALL CAPS'], ['PR0109', 'STUFF', 'ALL CAPS, generic word'], ['PR0110', 'Gear 1', 'under 8 characters']] },
  { k: 'cat', label: 'Category mismatches', sev: 'E', n: 11, rule: 'Product name implies a different category than its tag.',
    ids: P('0104 0118 0119 0111 0117 0114 0112 0115 0108 0113 0116'),
    ex: [['PR0118', 'TrailRunner Sleeping Bag', 'tagged Footwear, implies Outdoor Gear'], ['PR0119', 'HydroFlow Water Bottle', 'tagged Electronics, implies Accessories'], ['PR0117', 'CoreFit Wireless Earbuds', 'tagged Apparel, implies Electronics'], ['PR0114', 'BaseCamp Tent 2P', 'tagged Footwear, implies Outdoor Gear']] },
  { k: 'claim', label: 'Suspicious claims', sev: 'E', n: 9, rule: 'Description holds an absolute or superlative claim from a fixed phrase list.',
    ids: P('0125 0126 0128 0122 0123 0124 0120 0121 0127'),
    ex: [['PR0120', '', '"the best shoe in the world"'], ['PR0121', '', '"guaranteed to last forever"'], ['PR0122', '', '"100% perfect for everyone"'], ['PR0127', '', '"the only backpack you will ever need"']] },
  { k: 'color', label: 'Inconsistent colors', sev: 'W', n: 7, rule: 'Color is not clean Title Case.',
    ids: P('0130 0132 0131 0133 0134 0135 0129'),
    ex: [['PR0130', '', 'color = "BLACK"'], ['PR0131', '', 'color = "bLack"'], ['PR0133', '', 'color = " Navy" (leading space)'], ['PR0134', '', 'color = "white!"']] },
];
const rate = c => (c.sev === 'E' ? 12 : 6);          // tenths of a point per occurrence
const pen = c => c.n * rate(c);                      // tenths
const MAXPEN = Math.max(...CHECKS.map(pen));

const CSS = `.ca-dial{--p:33;--c:var(--red);width:150px;height:150px;border-radius:50%;flex:none;display:grid;place-items:center;
 background:conic-gradient(var(--c) calc(var(--p)*1%),var(--surface2) 0)}
.ca-dial>div{width:118px;height:118px;border-radius:50%;background:var(--surface);display:grid;place-items:center;text-align:center;line-height:1}
.ca-dial b{font-size:2.6rem;letter-spacing:-.04em}.ca-dial small{display:block;color:var(--faint);font:.7rem var(--mono);margin-top:4px}
.ca-top{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.ca-top>div:last-child{flex:1 1 220px;min-width:0}
.ca-chk{display:grid;grid-template-columns:1fr auto;gap:2px 10px;width:100%;text-align:left;background:var(--surface);color:var(--text);
 border:1px solid var(--line);border-radius:var(--r);padding:10px 12px;margin:0 0 8px;font:inherit;cursor:pointer}
.ca-chk:hover{border-color:var(--line2)}.ca-chk[aria-pressed=true]{border-color:var(--blue);background:#14202e}
.ca-chk .t{font-size:.9rem;font-weight:600}.ca-chk .m{font:.78rem var(--mono);color:var(--muted);text-align:right}
.ca-chk .bar{grid-column:1/-1;margin-top:6px}.ca-chk.fixed{opacity:.55}.ca-chk.fixed .m{text-decoration:line-through}
.ca-ids{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 12px}
.ca-ids .tok{margin:0}.ca-ids .tok.hit{border-color:var(--amber);color:var(--amber-lt)}
.ca-top .chip{white-space:normal}
.ca-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}`;

export function mount(root) {
  const fixed = new Set();
  let sel = 'desc';
  const st = h('style', CSS);
  const dial = h('div.ca-dial', { role: 'img' }, h('div', h('span', h('b', '33'), h('small', '/ 100'))));
  const math = h('p.d-note', { style: { margin: '0', fontFamily: 'var(--mono)' } });
  const verdict = h('div', { style: { marginTop: '6px' } });
  const list = h('div');
  const detail = h('div.d-card');
  const btnE = h('button.d-btn', { type: 'button', 'aria-pressed': 'false', onclick: () => toggleSev('E') }, 'Fix all ERRORs');
  const btnW = h('button.d-btn', { type: 'button', 'aria-pressed': 'false', onclick: () => toggleSev('W') }, 'Fix all WARNINGs');
  const btnR = h('button.d-btn', { type: 'button', onclick: () => { fixed.clear(); draw(); } }, 'Reset to 33');

  function toggleSev(s) {
    const group = CHECKS.filter(c => c.sev === s);
    const all = group.every(c => fixed.has(c.k));
    group.forEach(c => all ? fixed.delete(c.k) : fixed.add(c.k));
    draw();
  }

  function score() {
    const tenths = CHECKS.reduce((a, c) => a + (fixed.has(c.k) ? 0 : pen(c)), 0);
    return { tenths, score: Math.round(Math.max(0, 1000 - tenths) / 10) };
  }

  function draw() {
    const { tenths, score: s } = score();
    const col = s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)';
    dial.style.setProperty('--p', s); dial.style.setProperty('--c', col);
    dial.setAttribute('aria-label', 'Catalog quality score ' + s + ' out of 100');
    dial.firstChild.firstChild.firstChild.textContent = s;
    math.textContent = '100 − ' + (tenths / 10).toFixed(1) + ' = ' + ((1000 - tenths) / 10).toFixed(1) + ' → round → ' + s;
    verdict.replaceChildren(chip(s >= 70 ? 'healthy' : s >= 40 ? 'needs work' : 'poor', s >= 70 ? 'ok' : s >= 40 ? 'warn' : 'bad'),
      ' ', chip(fixed.size ? fixed.size + ' of 7 checks simulated as fixed' : 'as audited: 80 findings across 7 checks', 'info'));
    const e = CHECKS.filter(c => c.sev === 'E'), w = CHECKS.filter(c => c.sev === 'W');
    btnE.setAttribute('aria-pressed', e.every(c => fixed.has(c.k)));
    btnW.setAttribute('aria-pressed', w.every(c => fixed.has(c.k)));
    list.replaceChildren(...CHECKS.map(c => {
      const b = h('button.ca-chk' + (fixed.has(c.k) ? '.fixed' : ''), { type: 'button', 'aria-pressed': String(sel === c.k), onclick: () => { sel = c.k; draw(); } },
        h('span.t', c.label, ' ', chip(c.sev === 'E' ? 'ERROR' : 'WARNING', c.sev === 'E' ? 'bad' : 'warn')),
        h('span.m', c.n + ' × ' + (rate(c) / 10).toFixed(1) + ' = −' + (pen(c) / 10).toFixed(1)),
        h('div.bar' + (c.sev === 'E' ? '.red' : '.amber') + '.is-in', { style: { '--w': (pen(c) / MAXPEN * 100) + '%' } }, h('i')));
      return b;
    }));
    const c = CHECKS.find(x => x.k === sel);
    detail.replaceChildren(
      h('span.d-label', 'Guardrail firing · ' + c.label),
      h('p', { style: { margin: '0 0 4px' } }, c.rule),
      h('p.d-note', { style: { margin: '0 0 6px' } }, c.n + ' flagged product ids (first 5 are the sample the original reports):'),
      h('div.ca-ids', c.ids.map((id, i) => h('span.tok' + (i < 5 ? '.hit' : ''), id))),
      h('div.d-scroll', h('table.d-table', h('thead', h('tr', h('th', 'id'), h('th', 'product'), h('th', 'why it fired'))),
        h('tbody', c.ex.map(r => h('tr', h('td.num', r[0]), h('td', r[1] || '—'), h('td', r[2])))))),
      h('div.d-ctl', h('button.d-btn' + (fixed.has(c.k) ? '' : '.pri'), { type: 'button', onclick: () => { fixed.has(c.k) ? fixed.delete(c.k) : fixed.add(c.k); draw(); } },
        fixed.has(c.k) ? 'Undo fix' : 'Simulate fixing this check → +' + (pen(c) / 10).toFixed(1))));
  }

  root.append(st,
    h('div.ca-badges', chip('Deterministic · no LLM', 'ai'), chip('135 synthetic products', 'info'), chip('7 rule-based checks')),
    h('div.d-card.hl', h('div.ca-top', dial, h('div', h('span.d-label', 'Score = 100 − 1.2 per ERROR − 0.6 per WARNING'), math, verdict,
      h('div.d-ctl', btnE, btnW, btnR)))),
    h('div.d-split', { style: { marginTop: '16px', alignItems: 'start' } },
      h('div', h('span.d-label', 'Seven checks · click one to see what it flags'), list), detail),
    h('p.d-note', 'Each occurrence costs a fixed penalty, so counts are the whole story: 12 + 11 + 9 = 32 ERRORs (−38.4) and 16 + 15 + 10 + 7 = 48 WARNINGs (−28.8). Meant to run in front of or behind an LLM-written catalog: it is the check, not the writer. About 56% of products are flagged.'));
  draw();
  inView(root, null);
}
