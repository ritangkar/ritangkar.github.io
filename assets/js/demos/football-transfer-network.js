import { h, tabs, barRow, chip, inView } from './_kit.js';

// Synthetic data: 26 clubs, 336 transfers. Node: [id, name, country, x, y, pageRank, in, out, spentM, receivedM]
const NODES = [["C01","Ironbridge FC","Avonia",27,8.7,0.0447,15,10,90.5,12.9],["C02","Meridian United","Avonia",39,15,0.0489,17,19,42.6,66.1],["C03","Port Albans FC","Avonia",44,30,0.0281,10,10,21.3,20.3],["C04","Redcastle Athletic","Avonia",39,45,0.0308,10,12,31.2,42.1],["C05","Silverlake FC","Avonia",27,51.3,0.0685,24,18,57.8,98.9],["C06","Northgate Rovers","Avonia",15,45,0.0262,8,11,22.6,14.7],["C07","Coastal City FC","Avonia",10,30,0.0484,16,17,31.6,48.3],["C08","Highvale Wanderers","Avonia",15,15,0.0346,12,15,24.2,42.4],["C09","Castell Del Mar","Castellara",73,8.5,0.0458,15,13,85.3,26.5],["C10","Union Portena","Castellara",85.1,17.3,0.0378,12,16,32.6,33.1],["C11","Rio Alto FC","Castellara",85.1,34.8,0.034,12,13,28.1,32.8],["C12","Santa Vega","Castellara",73,43.5,0.0343,10,11,30.3,70.7],["C13","Cordillera SC","Castellara",60.9,34.8,0.0374,12,11,29,34.1],["C14","Bahia Norte","Castellara",60.9,17.3,0.0323,11,9,30.6,24.8],["C15","Eisenberg FC","Nordkessel",27,56.5,0.0411,14,13,122.2,29.1],["C16","Nordwind SV","Nordkessel",39.1,65.3,0.046,16,14,39.7,33],["C17","Stahltor 05","Nordkessel",39.1,82.7,0.041,13,14,27.3,43.4],["C18","Rheinfeld United","Nordkessel",27,91.5,0.0355,12,19,31.3,37],["C19","Kaltmoor SC","Nordkessel",14.9,82.8,0.0255,8,12,16.6,106.1],["C20","Frosthafen FC","Nordkessel",14.9,65.3,0.0432,16,17,24.6,41.4],["C21","Vantera Calcio","Vantera",73,56.5,0.0464,18,14,115,25.3],["C22","Monte Rosso","Vantera",85.1,65.3,0.0436,15,9,52,26.5],["C23","Porto Sud","Vantera",85.1,82.7,0.0357,12,7,23.6,16.8],["C24","Lago Chiaro","Vantera",73,91.5,0.029,9,12,17.7,98.6],["C25","Valle Dorata","Vantera",60.9,82.8,0.0307,9,11,18.5,30.6],["C26","Isola Blu","Vantera",60.9,65.3,0.0306,10,9,27.1,17.8]];
// Corridors (from, to, count) with count >= 2 (58 of 263 distinct corridors)
const EDGES = [["C01","C05",3],["C02","C08",3],["C26","C09",3],["C24","C18",2],["C21","C17",4],["C07","C20",2],["C10","C05",4],["C16","C09",2],["C19","C15",3],["C17","C12",2],["C18","C02",2],["C02","C03",2],["C11","C20",2],["C07","C18",2],["C22","C25",2],["C17","C03",3],["C07","C10",2],["C20","C25",3],["C17","C06",2],["C09","C07",2],["C11","C21",2],["C10","C26",2],["C02","C07",2],["C12","C16",3],["C17","C18",3],["C11","C22",2],["C18","C20",2],["C06","C05",2],["C07","C19",2],["C13","C10",2],["C01","C16",2],["C24","C02",2],["C06","C01",2],["C22","C07",2],["C08","C22",2],["C11","C05",2],["C16","C14",3],["C20","C23",3],["C20","C19",2],["C05","C22",2],["C04","C13",2],["C26","C01",2],["C14","C05",2],["C03","C20",2],["C10","C21",2],["C12","C09",2],["C15","C14",2],["C24","C07",2],["C18","C03",2],["C03","C05",2],["C18","C07",2],["C24","C21",2],["C09","C22",2],["C25","C08",2],["C20","C02",2],["C08","C11",3],["C20","C04",2],["C05","C02",2]];
// All 274 non-zero fees (EUR M), sorted. 62 further transfers had a zero fee.
const FEES = [0.3,0.4,0.4,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.6,0.6,0.6,0.6,0.6,0.7,0.7,0.7,0.7,0.7,0.8,0.8,0.8,0.8,0.8,0.9,0.9,0.9,0.9,1,1,1,1.1,1.1,1.1,1.1,1.1,1.1,1.1,1.1,1.2,1.2,1.2,1.3,1.3,1.3,1.3,1.3,1.3,1.3,1.3,1.3,1.3,1.4,1.4,1.4,1.4,1.4,1.4,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.6,1.6,1.6,1.6,1.6,1.6,1.7,1.7,1.7,1.7,1.8,1.8,1.8,1.8,1.8,1.8,1.9,1.9,1.9,1.9,1.9,1.9,1.9,1.9,1.9,1.9,2,2,2,2,2,2,2,2,2.1,2.1,2.1,2.1,2.2,2.2,2.2,2.2,2.2,2.2,2.2,2.2,2.3,2.3,2.3,2.3,2.4,2.4,2.4,2.4,2.4,2.4,2.4,2.4,2.5,2.5,2.5,2.5,2.5,2.6,2.6,2.6,2.7,2.7,2.7,2.7,2.7,2.7,2.8,2.8,2.8,2.9,2.9,2.9,2.9,2.9,2.9,2.9,3,3,3,3,3,3.1,3.1,3.1,3.1,3.1,3.1,3.2,3.2,3.2,3.2,3.3,3.3,3.3,3.3,3.3,3.4,3.4,3.4,3.4,3.5,3.5,3.5,3.6,3.6,3.6,3.6,3.6,3.7,3.7,3.7,3.7,3.7,3.7,3.7,3.8,3.8,3.8,3.8,3.9,3.9,3.9,3.9,4,4,4,4,4,4.1,4.1,4.1,4.1,4.1,4.1,4.1,4.2,4.2,4.2,4.2,4.2,4.2,4.3,4.4,4.4,4.4,4.4,4.4,4.4,4.4,4.5,4.5,4.6,4.6,4.6,4.7,4.7,4.8,4.8,4.8,4.8,4.9,4.9,4.9,5,5,5.2,5.3,5.3,5.4,5.4,5.5,5.6,5.6,5.6,5.6,5.7,5.7,5.7,5.7,5.8,5.8,5.9,6,6.1,6.3,6.3,6.3,6.6,6.6,6.8,6.8,6.9,8.1,8.1,8.5,8.7,9.5,57.4,58.8,72.1,86.5];
// Tukey outliers: [player, from, to, fee, date]
const OUT = [["Dario Dubois","C02","C06",9.5,"2022-07-13"],["Dimitri Moreau","C17","C04",8.1,"2023-01-18"],["Aksel Dubois","C02","C18",8.5,"2023-07-01"],["Mateo Novak","C03","C15",8.7,"2023-07-28"],["Ivo Mercer","C12","C09",58.8,"2024-12-24"],["Theo Weber","C19","C15",86.5,"2025-02-04"],["Kai Bauer","C24","C21",72.1,"2025-04-18"],["Emil Holt","C05","C01",57.4,"2025-04-26"],["Emil Dubois","C05","C02",8.1,"2025-07-11"]];
// Flurries: [club, windowStart, [[from, MM-DD, fee], ...]]
const FLUR = [["C05","2025-07-05",[["C18","07-05",4.1],["C21","07-20",2.7],["C11","07-23",3.6],["C01","07-25",2],["C06","08-03",3]]],["C21","2024-07-04",[["C06","07-04",0],["C10","07-05",2.1],["C24","07-08",5.2],["C19","07-22",1.9],["C12","07-28",0]]],["C22","2025-01-15",[["C15","01-15",6.6],["C20","01-17",5],["C18","01-22",4.4],["C01","01-27",0],["C09","02-04",6.3]]]];
// Boomerangs: [player, from, to(returned), date, fee]
const BOOM = [["Gino Moreau","C22","C02","2026-07-19",1.6],["Dimitri Ferreira","C16","C21","2026-07-18",2.2],["Theo Castillo","C08","C11","2026-07-13",1.6],["Rafael Farina","C11","C10","2026-07-18",1.4],["Cesar Novak","C02","C13","2025-07-22",1.6],["Luca Santini","C14","C04","2026-07-15",1.3],["Ivo Santini","C12","C16","2026-07-01",1.5],["Gino Keller","C26","C12","2026-01-17",1.3],["Theo Bauer","C22","C26","2026-02-02",2.3],["Dario Holt","C26","C07","2022-02-06",5.3],["Jamal Alvarez","C21","C17","2025-02-11",0],["Gino Holt","C06","C11","2025-07-02",1.1],["Ivo Mercer","C12","C09","2024-12-24",58.8],["Gino Rossi","C14","C06","2025-07-26",1.8],["Dario Ohlsson","C13","C10","2024-07-13",3],["Emil Ferreira","C20","C04","2025-07-25",4.6]];
const FENCE = 7.85;
const N = {}; NODES.forEach(n => { N[n[0]] = n; });
const nm = id => N[id][1];
const MAXPR = Math.max(...NODES.map(n => n[5])), MINPR = Math.min(...NODES.map(n => n[5]));
const rad = n => 1 + (n[5] - MINPR) / (MAXPR - MINPR) * 2.3;
const NS = 'http://www.w3.org/2000/svg';
const el = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
const CSS = `.tn-svg{width:100%;height:auto;max-width:560px;margin:0 auto;display:block}
.tn-strip{max-width:640px;margin:0 auto;display:block}
.tn-n{cursor:pointer}
.tn-n:focus-visible{outline:none}.tn-n:focus-visible circle{stroke:var(--amber);stroke-width:.7}
.tn-n circle{fill:var(--blue);fill-opacity:.8;stroke:var(--bg);stroke-width:.35;transition:fill-opacity .2s}
.tn-n:hover circle{fill-opacity:1}
.tn-n.sel circle{stroke:var(--text);stroke-width:.6}
.tn-n.hi-r circle{fill:var(--red)}.tn-n.hi-a circle{fill:var(--amber)}
.tn-n.dim circle{fill-opacity:.3}
.tn-lb{font:2.5px var(--sans);fill:var(--text);pointer-events:none}
.tn-co{font:3.1px var(--mono);fill:var(--faint);letter-spacing:.2px;text-anchor:middle;pointer-events:none}
.tn-pick{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.tn-pick .d-btn{font-size:.78rem;padding:6px 10px}
.tn-pick .d-btn[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#06121e}
.tn-pick .d-btn.am[aria-pressed=true]{background:var(--amber);border-color:var(--amber);color:#1a1004}
.tn-ln{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line);font-size:.85rem}
.tn-ln b{font:500 .82rem var(--mono);text-align:right}`;
let uid = 0;

function graph(o, onPick) {
  const id = 'tnm' + (++uid);
  const svg = el('svg', { viewBox: '6 4 84 92', class: 'tn-svg', role: 'group', 'aria-label': 'Club transfer graph. Node size is PageRank; edge width is number of transfers on the corridor.' });
  const defs = el('defs', {});
  [['a', 'var(--amber)'], ['r', 'var(--red)'], ['b', 'var(--blue-lt)']].forEach(([k, c]) => {
    const m = el('marker', { id: id + k, viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 3.2, markerHeight: 3.2, orient: 'auto-start-reverse' });
    m.append(el('path', { d: 'M0 0L6 3L0 6z', fill: c })); defs.append(m);
  });
  svg.append(defs);
  const co = { Avonia: [27, 31], Castellara: [73, 26], Nordkessel: [27, 74], Vantera: [73, 74] };
  const pos = k => [N[k][3], N[k][4]];
  const shrink = (a, b, r) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [b[0] - dx / d * r, b[1] - dy / d * r]; };
  const base = el('g', { opacity: o.hl && o.hl.length ? 0.35 : 1 });
  EDGES.forEach(([f, t, c]) => {
    const a = pos(f), b = pos(t);
    base.append(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'var(--blue)', 'stroke-opacity': 0.14 + c * 0.1, 'stroke-width': 0.18 + c * 0.22 }));
  });
  svg.append(base);
  Object.entries(co).forEach(([k, [x, y]]) => svg.append(el('text', { class: 'tn-co', x, y }, k.toUpperCase())));
  (o.hl || []).forEach(([f, t, k, w]) => {
    const a = pos(f), b = shrink(pos(f), pos(t), rad(N[t]) + 0.4);
    svg.append(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: k === 'r' ? 'var(--red)' : 'var(--amber)', 'stroke-width': w || 0.6, 'marker-end': `url(#${id}${k})` }));
  });
  const hiMap = o.nodes || {};
  const showLbl = new Set(o.labels || []);
  NODES.forEach(n => {
    const g = el('g', { class: 'tn-n' + (hiMap[n[0]] ? ' hi-' + hiMap[n[0]] : o.hl && o.hl.length ? ' dim' : '') + (o.sel === n[0] ? ' sel' : ''), tabindex: 0, role: 'button',
      'aria-label': `${n[1]}, PageRank ${n[5]}`, 'data-id': n[0] });
    g.append(el('circle', { cx: n[3], cy: n[4], r: rad(n) }));
    g.addEventListener('click', () => onPick(n[0]));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(n[0]); } });
    svg.append(g);
    if (showLbl.has(n[0]) || o.sel === n[0]) {
      const right = n[3] < 70;
      svg.append(el('text', { class: 'tn-lb', x: n[3] + (right ? rad(n) + 0.8 : -rad(n) - 0.8), y: n[4] + 0.9, 'text-anchor': right ? 'start' : 'end', 'font-weight': 600 }, n[1]));
    }
  });
  return svg;
}

function clubCard(id) {
  const n = N[id], rank = [...NODES].sort((a, b) => b[5] - a[5]).findIndex(x => x[0] === id) + 1;
  const ln = (a, b) => h('div.tn-ln', h('span', a), h('b', b));
  return h('div.d-card', { 'aria-live': 'polite' }, h('span.d-label', 'Selected club'), h('div', { style: { fontWeight: 650, fontSize: '1.05rem', marginBottom: '6px' } }, n[1], ' ', h('span.chip', n[2])),
    ln('PageRank', n[5].toFixed(4) + '  (rank ' + rank + ' of 26)'), ln('Signings in / sold out', n[6] + ' / ' + n[7]),
    ln('Spent / received', `€${n[8]}M / €${n[9]}M`), ln('Net spend', (n[8] - n[9] >= 0 ? '+' : '−') + '€' + Math.abs(n[8] - n[9]).toFixed(1) + 'M'));
}

function tabPR(p) {
  let sel = 'C05';
  const gh = h('div'), card = h('div');
  const top = [...NODES].sort((a, b) => b[5] - a[5]).slice(0, 6);
  const draw = () => { gh.replaceChildren(graph({ sel, labels: top.map(n => n[0]) }, id => { sel = id; draw(); })); card.replaceChildren(clubCard(sel)); };
  draw();
  p.append(h('div.d-split', h('div.d-card', h('span.d-label', 'Club graph: node size = PageRank, edge width = corridor count (2+ transfers). Click a club.'), gh),
    h('div', { style: { display: 'grid', gap: '14px', minWidth: 0, alignContent: 'start' } }, card,
      h('div.d-card', h('span.d-label', 'Top 6 by weighted PageRank'), top.map(n => barRow(n[1], n[5] / MAXPR * 100, n[5].toFixed(4), n[0] === 'C05' ? 'amber' : ''))),
      h('div.d-card', h('span.d-label', 'Algorithm'), h('pre.d-code', 'damping 0.85, uniform start 1/26\nweight = transfers from→to\nrepeat ≤200×, stop at Σ|Δ| < 1e-9\ndangling mass spread evenly'),
        h('p.d-note', 'Silverlake FC tops the ranking at 0.0685 with 24 signings in and 18 out: a well-connected hub, not the biggest spender (Eisenberg FC leads spend at €122.2M).')))));
}

function strip() {
  const W = 340, Hh = 150, pad = 14, base = 120, sc = f => pad + Math.sqrt(f / 90) * (W - 2 * pad);
  const svg = el('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'd-svg tn-strip', role: 'img', 'aria-label': 'Dot plot of 274 transfer fees on a square-root axis with the Tukey fence at 7.85 million euros' });
  [0, 2, 5, 10, 20, 40, 80].forEach(t => {
    svg.append(el('line', { x1: sc(t), x2: sc(t), y1: base + 2, y2: base + 6, stroke: 'var(--line2)' }), el('text', { class: 'm', x: sc(t), y: base + 17, 'text-anchor': 'middle' }, '€' + t + 'M'));
  });
  svg.append(el('line', { x1: pad, x2: W - pad, y1: base + 2, y2: base + 2, stroke: 'var(--line2)' }));
  const stack = {};
  FEES.forEach(f => {
    const b = Math.round(sc(f) / 3.2), k = (stack[b] = (stack[b] || 0) + 1);
    const out = f > FENCE;
    svg.append(el('circle', { cx: (b * 3.2).toFixed(1), cy: base - 1.8 - (k - 1) * 3.1, r: out ? 2.2 : 1.35, fill: out ? 'var(--red)' : 'var(--blue)', 'fill-opacity': out ? 1 : 0.75 }));
  });
  const fx = sc(FENCE);
  svg.append(el('line', { x1: fx, x2: fx, y1: 14, y2: base + 2, stroke: 'var(--red)', 'stroke-dasharray': '4 3', 'stroke-width': 1.4 }),
    el('text', { x: fx + 5, y: 22, fill: 'var(--red)', style: 'fill:var(--red);font-weight:600' }, 'Tukey fence €7.85M'),
    el('text', { class: 'm', x: fx + 5, y: 33 }, 'Q3 4.10 + 1.5 × IQR 2.50'));
  [[sc(58) - 3, base - 14, 'end', '€57–59M ×2'], [sc(72.1), base - 30, 'middle', '€72.1M'], [sc(86.5) + 6, base - 14, 'end', '€86.5M']].forEach(([x, y, an, t]) => {
    svg.append(el('text', { class: 'm', x, y, 'text-anchor': an, style: 'fill:var(--red)' }, t));
  });
  svg.append(el('text', { class: 'm', x: W - pad, y: Hh - 2, 'text-anchor': 'end' }, 'square-root axis; each dot is one transfer'));
  return svg;
}

function tabFee(p) {
  const hl = OUT.map(o => [o[1], o[2], 'r', o[3] > 20 ? 0.9 : 0.5]);
  const nodes = {}; OUT.forEach(o => { nodes[o[1]] = 'r'; nodes[o[2]] = 'r'; });
  let sel = null;
  const gh = h('div'), card = h('div');
  const draw = () => { gh.replaceChildren(graph({ hl, nodes, sel, labels: ['C15', 'C21', 'C19', 'C24', 'C01', 'C05'] }, id => { sel = id; draw(); })); card.replaceChildren(sel ? clubCard(sel) : h('p.d-note', { style: { margin: 0 } }, 'Click a club node to see its flows.')); };
  draw();
  p.append(h('div.d-card', h('span.d-label', 'Fee distribution: 274 non-zero fees'), strip(),
    h('p.d-note', { style: { marginTop: '4px' } }, 'Method: sort the fees, take Q1/Q3 by linear interpolation, flag anything above Q3 + 1.5 × IQR. 9 of 274 cross the fence; 4 are extreme (€57–87M), 5 are mild (€8.1–9.5M).')),
    h('div.d-split', { style: { marginTop: '14px' } }, h('div.d-card', h('span.d-label', 'Flagged deals on the graph (red = outlier fee)'), gh),
      h('div', { style: { display: 'grid', gap: '14px', minWidth: 0, alignContent: 'start' } }, card,
        h('div.d-card', h('span.d-label', 'Outliers, largest first'), h('div.d-scroll', h('table.d-table', h('thead', h('tr', ['Player', 'From → to', 'Fee'].map(x => h('th', x)))),
          h('tbody', [...OUT].sort((a, b) => b[3] - a[3]).map(o => h('tr', h('td', o[0]), h('td', nm(o[1]) + ' → ' + nm(o[2])), h('td.num', '€' + o[3] + 'M'))))))))));
}

function tabFlur(p) {
  let mode = 'f', idx = 0;
  const bar = h('div.tn-pick', { role: 'group', 'aria-label': 'Anomaly kind' });
  const list = h('div.tn-pick', { role: 'group', 'aria-label': 'Choose a case' });
  const gh = h('div'), info = h('div.d-card', { 'aria-live': 'polite' });
  const mk = (t, k) => h('button.d-btn', { type: 'button', 'aria-pressed': mode === k, onclick: () => { mode = k; idx = 0; draw(); } }, t);
  function draw() {
    bar.replaceChildren(mk('Transfer flurries (3)', 'f'), mk('Boomerangs (16)', 'b'));
    const n = mode === 'f' ? FLUR.length : BOOM.length;
    list.replaceChildren(...Array.from({ length: n }, (_, i) => h('button.d-btn.am', { type: 'button', 'aria-pressed': i === idx, onclick: () => { idx = i; draw(); } },
      mode === 'f' ? nm(FLUR[i][0]) : BOOM[i][0])));
    let hl, nodes = {}, labels = [];
    if (mode === 'f') {
      const [c, start, sg] = FLUR[idx];
      hl = sg.map(s => [s[0], c, 'a', 0.55]); nodes[c] = 'a'; sg.forEach(s => { nodes[s[0]] = 'a'; }); labels = [c];
      info.replaceChildren(h('span.d-label', 'Rule: >= 5 incoming signings inside any 30-day window'), h('div', { style: { fontWeight: 650, marginBottom: '6px' } }, `${nm(c)}: 5 signings from ${start}`),
        ...sg.map(s => h('div.tn-ln', h('span', s[1] + '  from ' + nm(s[0])), h('b', s[2] ? '€' + s[2] + 'M' : 'free/loan'))));
    } else {
      const [pl, f, t, d, fee] = BOOM[idx];
      hl = [[f, t, 'a', 0.9]]; nodes[t] = 'a'; nodes[f] = 'a'; labels = [f, t];
      info.replaceChildren(h('span.d-label', 'Rule: player re-joins a club already in his history'), h('div', { style: { fontWeight: 650, marginBottom: '6px' } }, pl + ' returned to ' + nm(t)),
        h('div.tn-ln', h('span', 'Moved from'), h('b', nm(f))), h('div.tn-ln', h('span', 'Back at'), h('b', nm(t))), h('div.tn-ln', h('span', 'Date'), h('b', d)), h('div.tn-ln', h('span', 'Fee'), h('b', fee ? '€' + fee + 'M' : 'free/loan')));
    }
    gh.replaceChildren(graph({ hl, nodes, labels }, () => {}));
  }
  draw();
  p.append(bar, list, h('div.d-split', h('div.d-card', h('span.d-label', 'Amber = the flagged moves'), gh), info),
    h('p.d-note', 'Both detectors are plain loops over the transfer list: a sliding 30-day window per club, and a visited-clubs set per player. Synthetic data.'));
}

export function mount(root) {
  root.append(h('style', CSS),
    h('p.d-note', { style: { margin: '0 0 12px' } }, 'A transfer market as a directed graph: 26 synthetic clubs, 220 players, 336 transfers. A hand-written weighted PageRank finds hubs; three statistical rules flag irregular deals. Graph analytics and rules, no ML.'));
  tabs(root, [
    { id: 'pr', label: 'Centrality (PageRank)', render: tabPR },
    { id: 'fee', label: 'Fee outliers', render: tabFee },
    { id: 'flur', label: 'Flurries & boomerangs', render: tabFlur },
  ]);
  inView(root, null);
}
