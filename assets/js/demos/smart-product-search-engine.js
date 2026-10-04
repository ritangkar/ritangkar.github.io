import { h, stepper, barRow as _barRow, chip, stat, inr, inView } from './_kit.js';

const barRow = (l, p, t, v) => { const r = _barRow(l, p, t, v); r.querySelector('.bar').style.setProperty('--w', Math.max(0, Math.min(100, p)) + '%'); return r; }; // kit barRow drops the --w custom property

// Real values from the BM25 index over the 124-product synthetic catalogue.
const Q = 'running shoes long distance running';
const TOK = ['running', 'shoes', 'long', 'distance', 'running'];
const IDF = [['running', 50, 0.906], ['shoes', 0, 5.521], ['long', 5, 3.124], ['distance', 19, 1.858]];
const FUNNEL = [['Whole catalogue', 124], ['Category = Footwear', 40], ['Color = Black', 10], ['Price ≤ ₹8,000 · in stock', 7]];
const FILTERED = [
  ['ZenithWear Drift 271', 3044, 4.1, 8.967, 'running ×3, long ×2, distance ×2'],
  ['ZenithWear Momentum 620', 2536, 3.8, 2.8, 'running ×3'],
  ['PacePro Drift 400', 4797, 3.6, 1.587, 'running ×1'],
  ['TrailRunner Pulse 778', 7014, 3.5, 1.587, 'running ×1 · ties above, rating 3.5 < 3.6 breaks it'],
  ['CoreFit Summit Boot', 4648, 4.6, 0, 'no query term · kept only by the filters'],
  ['TrailBlazer Ridge Boot', 4407, 4.4, 0, 'no query term'],
  ['NorthPeak Ridge Boot', 3935, 3.6, 0, 'no query term'],
];
const UNFILTERED = [
  ['StrideMax Surge 677', 10275, 4.7, 8.967], ['ZenithWear Drift 158', 5707, 4.5, 8.967], ['ZenithWear Drift 271', 3044, 4.1, 8.967],
  ['ZenithWear Drift 548', 8779, 3.2, 8.967], ['StrideMax Surge 207', 5002, 3.2, 8.967], ['CoreFit Running Watch', 11870, 4.6, 4.626],
  ['CoreFit Running Watch', 11265, 4.4, 4.626], ['CoreFit Running Watch', 5500, 4.4, 4.626], ['PacePro Running Watch', 6277, 3.8, 4.626],
  ['SprintFlex Momentum 555', 9236, 4.8, 2.8],
];
const STEPS = [
  { k: '01', title: 'Tokenise', sub: 'lowercase [a-z0-9]+, len ≥ 2, stopwords out' },
  { k: '02', title: 'Weight (IDF)', sub: 'rare terms count more' },
  { k: '03', title: 'Hard filters', sub: 'applied before ranking' },
  { k: '04', title: 'BM25 rank', sub: 'k1 = 1.5, b = 0.75' },
];

export function mount(root) {
  let filtered = true;
  const stage = h('div');
  const st = stepper(root, STEPS, i => draw(i));
  root.append(stage);
  inView(root, null);

  const toggle = () => h('button.d-btn', { type: 'button', 'aria-pressed': String(filtered), onclick: () => { filtered = !filtered; draw(st.index); } },
    filtered ? 'Filters ON · switch to unfiltered' : 'Filters OFF · switch back to filtered');

  function draw(i) {
    stage.replaceChildren();
    if (i === 0) {
      stage.append(h('div.d-card', h('span.d-label', 'Query'), h('div.d-code', Q),
        h('span.d-label', { style: { marginTop: '14px' } }, 'Tokens (5 · note "running" appears twice and is counted twice)'),
        h('div', TOK.map((t, j) => h('span.tok.hit', t + (j === 4 ? ' ' : '')))),
        h('p.d-note', 'No stemming: the catalogue says "shoe", the query says "shoes", so "shoes" will match nothing. The index covers name + description + use case + brand + material of all 124 products, not just the filtered subset.')));
    } else if (i === 1) {
      const box = h('div.d-card', h('span.d-label', 'idf = ln((N − n + 0.5) / (n + 0.5) + 1) · N = 124'));
      IDF.forEach(([t, n, v]) => box.append(barRow(t + ' (n=' + n + ')', v / 5.6 * 100, v.toFixed(3), t === 'shoes' ? 'dim' : t === 'long' ? 'amber' : '')));
      box.append(h('p.d-note', '"long" appears in only 5 documents, so it is worth 3.4× a "running" hit. "shoes" has the highest idf but zero documents, so it contributes nothing to any score.'));
      stage.append(box); box.classList.add('is-in');
    } else if (i === 2) {
      const box = h('div.d-card', h('span.d-label', 'Candidates remaining'));
      FUNNEL.forEach(([l, n], j) => box.append(barRow(l, n / 124 * 100, String(n), j === 3 ? 'green' : '')));
      box.append(h('p.d-note', 'Filters: Footwear · Black · max ₹8,000 · in stock. Hard constraints run first; ranking only orders what survives. Without filters: 115 in-stock candidates.'));
      stage.append(box); box.classList.add('is-in');
    } else {
      const rows = filtered ? FILTERED : UNFILTERED;
      const box = h('div.d-card', h('div.d-ctl', { style: { marginTop: 0 } }, toggle(), chip(filtered ? '7 candidates' : '115 candidates · top 10 shown', filtered ? 'ok' : 'info')));
      rows.forEach((r, j) => box.append(h('div', { style: { margin: '12px 0' } },
        barRow((j + 1) + '. ' + r[0], r[3] / 8.967 * 100, r[3].toFixed(3), r[3] === 0 ? 'dim' : j < 1 && filtered ? 'amber' : ''),
        h('div.d-note', { style: { margin: 0 } }, inr(r[1]) + ' · ★' + r[2] + (r[4] ? ' · ' + r[4] : '')))));
      box.append(h('p.d-note', filtered ? 'Sorted by BM25, ties broken by rating. Score 0 means "passes the filters but matches no query term".' : 'Without filters five products tie at 8.967 and rating decides the order, so a ₹10,275 shoe outranks the ₹3,044 one that actually fit the budget. That is why filters run first.'));
      stage.append(box); box.classList.add('is-in');
    }
  }
  st.go(3);
}
