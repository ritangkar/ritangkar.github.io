import { h, barRow, chip, stat, inr, inView, reduced } from './_kit.js';

// Real output of the revenue-analysis run over the synthetic dataset (659 orders, 2 periods).
const A = { label: 'Period A · Jun 1–30', v: 1673583 }, B = { label: 'Period B · Jul 1–30', v: 1211063 };
const LANES = [
  { id: 'PRODUCT', name: 'Product', rule: 'top-3 decliners · Δ ≤ −₹3,000 · HIGH if |Δ| ≥ 30%', n: 3 },
  { id: 'REGION', name: 'Region', rule: 'drop ≤ −15% · HIGH ≤ −40%', n: 1 },
  { id: 'PAYMENT', name: 'Payment', rule: 'failure rate +≥ 5 pts · HIGH ≥ 10', n: 1 },
  { id: 'RETURNS', name: 'Returns', rule: 'category return rate +≥ 5 pts · HIGH ≥ 12', n: 1 },
  { id: 'STOCKOUT', name: 'Stockout', rule: 'zero stock in B · sales ≤ 30% of prior rate', n: 1 },
  { id: 'CANCELLATION', name: 'Cancellation', rule: 'cancel rate +≥ 2 pts · HIGH ≥ 5', n: 0 },
];
const F = [
  { c: 'REGION', sev: 'HIGH', t: 'South region revenue down 80.13%', imp: 394216, ev: ['Period A revenue: ₹4,91,990', 'Period B revenue: ₹97,774', 'Change: ₹−3,94,216 (−80.13%)'], why: 'Rule: regional drop ≤ −15%; HIGH at ≤ −40% → fired HIGH.' },
  { c: 'STOCKOUT', sev: 'HIGH', t: 'TrailRunner X200 went out of stock on 2026-07-19', imp: 274963, mod: 1, ev: ['Stock reached zero on: 2026-07-19', 'Days out of stock in this period: 12', 'Units/day before stockout: 3.22', 'Units/day during stockout: 0.17', 'Estimated lost revenue: ₹2,74,963 (modelled)'], why: 'Rule: sales during ≤ 30% of before (0.17 / 3.22 ≈ 5%) → fired. Impact = lost units/day × price × days out.' },
  { c: 'PRODUCT', sev: 'HIGH', t: 'BaseCamp Tent 2P revenue down 40.54%', imp: 134985, ev: ['Period A revenue: ₹3,32,963', 'Period B revenue: ₹1,97,978', 'Change: ₹−1,34,985 (−40.54%)'], why: 'Rule: Δ ≤ −₹3,000 and |%| ≥ 30 → HIGH.' },
  { c: 'PRODUCT', sev: 'HIGH', t: 'SprintFlex Racer revenue down 35.9%', imp: 83986, ev: ['Period A revenue: ₹2,33,961', 'Period B revenue: ₹1,49,975', 'Change: ₹−83,986 (−35.9%)'], why: 'Rule: Δ ≤ −₹3,000 and |%| ≥ 30 → HIGH.' },
  { c: 'PRODUCT', sev: 'HIGH', t: 'UrbanStride Low revenue down 50%', imp: 81681, ev: ['Period A revenue: ₹1,63,362', 'Period B revenue: ₹81,681', 'Change: ₹−81,681 (−50%)'], why: 'Rule: Δ ≤ −₹3,000 and |%| ≥ 30 → HIGH.' },
  { c: 'PAYMENT', sev: 'HIGH', t: 'WALLET payment failures up 10.32 points', imp: 36075, mod: 1, ev: ['Period A failure rate: 8.43%', 'Period B failure rate: 18.75%', 'Period B WALLET attempts: 80', 'Estimated revenue at risk: ₹36,075 (modelled)'], why: 'Rule: failure rate +≥ 5 pts; HIGH ≥ 10 → fired HIGH. Impact = extra failures × avg order value.' },
  { c: 'RETURNS', sev: 'MEDIUM', t: 'Apparel return rate up 11.58 points', imp: 22895, mod: 1, ev: ['Period A return rate: 8.14%', 'Period B return rate: 19.72%', 'Period B successful Apparel orders: 71', 'Estimated revenue impact: ₹22,895 (modelled)'], why: 'Rule: return rate +≥ 5 pts; HIGH needs ≥ 12 → 11.58 stays MEDIUM.' },
];
const SEV = { HIGH: 'bad', MEDIUM: 'warn' };
const CSS = `.erd .ln{display:grid;grid-template-columns:auto 1fr auto;gap:4px 12px;align-items:center;width:100%;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:10px 12px;color:var(--text);font:inherit;cursor:pointer;opacity:.45;transition:opacity .4s,border-color .3s}
.erd .ln.on{opacity:1}.erd .ln.fire.on{border-color:rgba(239,143,143,.5)}.erd .ln[aria-pressed=true]{outline:2px solid var(--blue);outline-offset:1px}
.erd .ln b{font-size:.88rem}.erd .ln small{grid-column:1/-1;color:var(--muted);font:.74rem var(--mono)}
.erd .dot{width:10px;height:10px;border-radius:50%;background:var(--line2)}.erd .ln.fire.on .dot{background:var(--red)}.erd .ln.quiet.on .dot{background:var(--green)}
.erd .fc{border:1px solid var(--line);border-left:3px solid var(--red);border-radius:var(--r);background:var(--surface);margin:10px 0}
.erd .fc.m{border-left-color:var(--amber)}
.erd .fh{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;width:100%;text-align:left;background:none;border:0;color:var(--text);font:inherit;padding:12px 14px;cursor:pointer}
.erd .fh .rk{font:600 .8rem var(--mono);color:var(--faint);grid-row:span 3}.erd .fh .tt{font-weight:600;font-size:.92rem}
.erd .fb{padding:0 14px 14px 44px;font-size:.84rem;color:var(--muted)}.erd .fb ul{margin:6px 0;padding-left:18px}
@media(max-width:520px){.erd .fb{padding-left:14px}}`;

export function mount(root) {
  const el = h('div.erd', h('style', CSS));
  root.append(el);
  let filter = null;

  // Headline
  const delta = h('div.d-stat.bad', '−27.64%', h('small', '−₹4,62,520'));
  el.append(
    h('div.d-ctl', chip('Synthetic data · 659 orders', 'info'), chip('Deterministic stats + thresholds · no LLM', 'ok')),
    h('div.d-split',
      h('div.d-card', h('span.d-label', 'The question'), delta, h('p.d-note', { style: { marginTop: '8px' } }, 'Recognised revenue (COMPLETED orders only) fell between two equal halves of the date range. Why?')),
      h('div.d-card', h('span.d-label', 'Revenue, A → B'), barRow('Jun 1–30', 100, inr(A.v)), barRow('Jul 1–30', B.v / A.v * 100, inr(B.v), 'red'))
    ));

  // Lanes
  const laneBox = h('div', { style: { display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))' } });
  const lanes = LANES.map(l => {
    const fired = l.n > 0;
    const b = h('button.ln.on.' + (fired ? 'fire' : 'quiet'), { type: 'button', 'aria-pressed': 'false', onclick: () => setFilter(filter === l.id ? null : l.id) },
      h('span.dot'), h('b', l.name + ' detector'), chip(fired ? l.n + ' finding' + (l.n > 1 ? 's' : '') : 'no signal', fired ? 'bad' : 'ok'), h('small', l.rule));
    b.dataset.id = l.id; laneBox.append(b); return b;
  });
  const runBtn = h('button.d-btn.pri', { type: 'button', onclick: () => run() }, '▶ Run six detectors');
  el.append(h('h3.d-label', { style: { marginTop: '22px' } }, 'Six independent detectors, hard-coded thresholds'),
    h('div.d-ctl', runBtn, h('span.d-note', { style: { margin: 0 } }, 'Click a lane to filter the evidence below.')), laneBox);

  function run() {
    lanes.forEach(l => l.classList.remove('on'));
    lanes.forEach((l, i) => reduced ? l.classList.add('on') : setTimeout(() => l.classList.add('on'), 220 * i));
  }

  // Evidence
  const list = h('div'); const hdr = h('h3.d-label', { style: { marginTop: '22px' } });
  el.append(hdr, list);
  function card(f, i, open) {
    const body = h('div.fb', { id: 'erd-b' + i, hidden: !open }, h('ul', f.ev.map(e => h('li', e))), h('p', { style: { margin: '6px 0 0' } }, f.why));
    const btn = h('button.fh', { type: 'button', 'aria-expanded': String(open), 'aria-controls': 'erd-b' + i, onclick: () => { const x = btn.getAttribute('aria-expanded') !== 'true'; btn.setAttribute('aria-expanded', x); body.hidden = !x; } },
      h('span.rk', '#' + (i + 1)),
      h('span.tt', f.t),
      h('span', chip(f.c, 'info'), ' ', chip(f.sev, SEV[f.sev]), ' ', f.mod ? chip('modelled', 'ai') : null),
      h('div.d-row', { style: { margin: 0 } }, h('span', 'impact'), h('div.bar' + (f.sev === 'HIGH' ? '.red' : '.amber'), { style: { '--w': (f.imp / 394216 * 100) + '%' } }, h('i')), h('span.n', inr(f.imp))));
    return h('div.fc' + (f.sev === 'HIGH' ? '' : '.m'), btn, body);
  }
  function setFilter(id) {
    filter = id;
    lanes.forEach(l => l.setAttribute('aria-pressed', String(l.dataset.id === id)));
    const rows = F.map((f, i) => [f, i]).filter(([f]) => !id || f.c === id);
    hdr.textContent = id ? 'Evidence · ' + id.toLowerCase() + ' detector' : 'Ranked evidence · by ₹ impact';
    list.replaceChildren(...(rows.length ? rows.map(([f, i]) => card(f, i, i === 0 && !id)) : [h('p.d-note', 'This detector did not fire: cancellation rate rose by less than the 2-point threshold.')]));
    list.classList.remove('is-in'); inView(list, null);
  }
  setFilter(null);

  el.append(h('div.d-card.hl', { style: { marginTop: '18px' } }, h('span.d-label', 'Read this carefully'),
    h('p', { style: { margin: 0, fontSize: '.88rem' } }, 'Findings overlap, so they are not additive. The South collapse very likely subsumes part of the stockout and product declines, which is why the individual impacts (₹3.9L + ₹2.7L + ₹1.3L + …) exceed the ₹4.6L headline drop. Items marked "modelled" are estimates, not ledger values. Ranking is by ₹ impact, then each card shows the raw evidence behind it.')));

  inView(el, () => run());
}
