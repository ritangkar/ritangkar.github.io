import { h, stepper, chip, inr, inView } from './_kit.js';

// Line-for-line port of the PricingEngine rules. Coefficients are illustrative, not fitted.
const K = { TARGET: 14, INV_S: 0.4, DEM_S: 0.08, ELAS: -1.6, COMP: 0.15, INV_CAP: 6, COMP_CAP: 5, MAX_MOVE: 10, MARGIN: 15 };
const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = v => Math.round(v * 100) / 100;
const sg = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);

function engine(q) {
  const demandAdj = q.demand * K.DEM_S;
  const dos = q.inv / q.vel;
  const invAdj = cl((K.TARGET - dos) * K.INV_S, -K.INV_CAP, K.INV_CAP);
  const gap = (q.comp - q.price) / q.price * 100;
  const compAdj = cl(gap * K.COMP, -K.COMP_CAP, K.COMP_CAP);
  const raw = demandAdj + invAdj + compAdj;
  const capped = cl(raw, -K.MAX_MOVE, K.MAX_MOVE);
  let cand = q.price * (1 + capped / 100);
  const floor = q.cost * (1 + K.MARGIN / 100);
  const floorFired = cand < floor; if (floorFired) cand = floor;
  let ceil = null, ceilFired = false;
  if (q.ceilPct != null) { ceil = q.comp * (1 + q.ceilPct / 100); if (cand > ceil) { cand = ceil; ceilFired = true; } }
  const price = Math.round(cand);
  const pc = r2((price - q.price) / q.price * 100);
  const units = r2(q.demand + K.ELAS * pc);
  const rev = r2(((1 + pc / 100) * (1 + units / 100) - 1) * 100);
  const adjV = q.vel * (1 + units / 100);
  const pdos = q.inv / Math.max(0.01, adjV);
  const risk = pdos < 5 ? 'HIGH' : pdos < 15 ? 'MEDIUM' : pdos <= 60 ? 'LOW' : pdos <= 120 ? 'MEDIUM' : 'HIGH';
  return { demandAdj, dos, invAdj, gap, compAdj, raw, capped, capFired: capped !== raw, floor, floorFired, ceil, ceilFired, price, pc, units, rev, pdos, risk, candPreFloor: q.price * (1 + capped / 100) };
}

const FIELDS = [
  { k: 'price', label: 'Current price', min: 500, max: 20000, step: 50, f: inr },
  { k: 'cost', label: 'Cost price', min: 200, max: 15000, step: 50, f: inr },
  { k: 'inv', label: 'Inventory (units)', min: 1, max: 500, step: 1, f: v => v },
  { k: 'vel', label: 'Sales velocity (units/day)', min: 0.5, max: 30, step: 0.5, f: v => v },
  { k: 'demand', label: 'Demand change', min: -50, max: 100, step: 1, f: v => sg(v, 0) + '%' },
  { k: 'comp', label: 'Competitor price', min: 500, max: 20000, step: 50, f: inr },
];
const SCEN = [
  { id: 'def', label: 'Default: demand spike', q: { price: 7199, cost: 4500, inv: 17, vel: 3, demand: 34, comp: 7499 }, ceil: '' },
  { id: 'over', label: 'Overstock: margin floor', q: { price: 7199, cost: 6900, inv: 300, vel: 3, demand: -30, comp: 6500 }, ceil: '' },
  { id: 'ceil', label: 'Default + competitor ceiling', q: { price: 7199, cost: 4500, inv: 17, vel: 3, demand: 34, comp: 7499 }, ceil: '0' },
];
const STAGES = [
  { title: 'Signals', sub: 'demand, stock, rival' },
  { title: 'Combine', sub: 'sum × seasonality' },
  { title: '±10% clamp', sub: 'max single move' },
  { title: 'Margin floor', sub: 'cost × 1.15' },
  { title: 'Competitor ceiling', sub: 'optional' },
];
const CSS = `.prc-big{font-size:clamp(2rem,6vw,2.8rem);font-weight:700;letter-spacing:-.03em;line-height:1.05}
.prc-pre{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.prc-pre .d-btn[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#06121e}
.prc-r{display:grid;grid-template-columns:minmax(120px,210px) 1fr 4.6em;gap:10px;align-items:center;margin:7px 0;font-size:.84rem}
.prc-t{position:relative;height:12px;background:var(--surface2);border-radius:6px}
.prc-t::after{content:"";position:absolute;left:50%;top:-3px;bottom:-3px;width:1px;background:var(--line2)}
.prc-t i{position:absolute;top:0;bottom:0;border-radius:6px;transition:left .5s,width .5s}
.prc-sl{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin-bottom:9px;font-size:.82rem}
.prc-sl input,.prc-sl select{grid-column:1/-1;width:100%;accent-color:var(--blue)}
.prc-sl select{background:var(--bg);color:var(--text);border:1px solid var(--line2);border-radius:8px;padding:8px}
.prc-sl output{font:.8rem var(--mono);color:var(--amber-lt)}
.prc-step .chip{margin-top:6px}
.d-step.prc-fired{border-color:var(--amber)}
.prc-line{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line);font-size:.86rem}
.prc-line b{font-family:var(--mono);font-weight:500;text-align:right}
@media(max-width:760px){.prc-split>:last-child{order:-1}}
@media(max-width:520px){.prc-r{grid-template-columns:1fr 4.6em}.prc-t{grid-column:1/-1;order:3}}`;

export function mount(root) {
  const q = { ...SCEN[0].q }; let ceilPct = null;
  const ins = {}, outs = {}, preBtns = [];
  let R, st;

  const detail = h('div.d-card.hl', { 'aria-live': 'polite' });
  const result = h('div.d-card');
  const verdict = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' } });

  const sliders = FIELDS.map(f => {
    const id = 'prc-' + f.k;
    outs[f.k] = h('output', { for: id });
    ins[f.k] = h('input', { type: 'range', id, min: f.min, max: f.max, step: f.step, oninput: e => { q[f.k] = +e.target.value; clearPre(); sync(); } });
    return h('div.prc-sl', h('label', { for: id }, f.label), outs[f.k], ins[f.k]);
  });
  const ceilSel = h('select', { id: 'prc-ceil', onchange: e => { ceilPct = e.target.value === '' ? null : +e.target.value; clearPre(); sync(); } },
    h('option', { value: '' }, 'Off'), h('option', { value: '0' }, 'Never above competitor (0%)'), h('option', { value: '3' }, 'At most 3% above competitor'));
  sliders.push(h('div.prc-sl', h('label', { for: 'prc-ceil' }, 'Competitor ceiling (optional rule)'), h('span'), ceilSel));

  const preBar = h('div.prc-pre', { role: 'group', 'aria-label': 'Scenarios' }, SCEN.map((s, i) => {
    const b = h('button.d-btn', { type: 'button', 'aria-pressed': 'false', onclick: () => setScen(i) }, s.label); preBtns[i] = b; return b;
  }));
  function clearPre() { preBtns.forEach(b => b.setAttribute('aria-pressed', 'false')); }
  function setScen(i) {
    Object.assign(q, SCEN[i].q); ceilPct = SCEN[i].ceil === '' ? null : +SCEN[i].ceil; ceilSel.value = SCEN[i].ceil;
    sync(); clearPre(); preBtns[i].setAttribute('aria-pressed', 'true');
    if (st) { const f = [R.capFired, R.floorFired, R.ceilFired].findIndex(Boolean); st.go(f < 0 ? 0 : f + 2); }
  }

  const line = (a, b) => h('div.prc-line', h('span', a), h('b', b));
  const div = (label, v, cap) => {
    const half = Math.min(50, Math.abs(v) / cap * 50);
    return h('div.prc-r', h('span', label), h('div.prc-t', h('i', { style: { left: (v >= 0 ? 50 : 50 - half) + '%', width: half + '%', background: v >= 0 ? 'var(--blue)' : 'var(--amber)' } })), h('span.n', { style: { font: '.78rem var(--mono)', textAlign: 'right' } }, sg(v) + '%'));
  };

  function renderDetail(i) {
    const e = R, b = [];
    if (i === 0) {
      b.push(h('span.d-label', 'Stage 1: three independent signals, each capped'),
        div('Demand ' + sg(q.demand, 0) + '% × 0.08', e.demandAdj, 6),
        div(`Stock ${e.dos.toFixed(1)}d vs 14d × 0.4`, e.invAdj, 6),
        div(`Rival ${sg(e.gap, 1)}% gap × 0.15`, e.compAdj, 6),
        h('p.d-note', { style: { marginTop: '6px' } }, 'Stock signal capped at ±6%, competitor signal at ±5%. Coefficients are illustrative, not fitted.'));
    } else if (i === 1) {
      b.push(h('span.d-label', 'Stage 2: add the signals (seasonality factor 1.0)'),
        line('demand + stock + competitor', `${sg(e.demandAdj)} ${sg(e.invAdj)} ${sg(e.compAdj)}`), line('raw combined move', sg(e.raw) + '%'));
    } else if (i === 2) {
      b.push(h('span.d-label', 'Stage 3: cap any single move at ±10%'), line('raw move', sg(e.raw) + '%'), line('after clamp', sg(e.capped) + '%'),
        line('candidate price', inr(Math.round(e.candPreFloor))), h('div', { style: { marginTop: '8px' } }, e.capFired ? chip('FIRED: move capped', 'warn') : chip('PASS: within ±10%', 'ok')));
    } else if (i === 3) {
      b.push(h('span.d-label', 'Stage 4: never sell below cost × 1.15'), line('floor = ' + inr(q.cost) + ' × 1.15', inr(Math.round(e.floor))),
        line('candidate before floor', inr(Math.round(e.candPreFloor))), h('div', { style: { marginTop: '8px' } }, e.floorFired ? chip('FIRED: margin floor enforced, price raised to ' + inr(Math.round(e.floor)), 'bad') : chip('PASS: above floor', 'ok')));
    } else {
      b.push(h('span.d-label', 'Stage 5: optional competitor ceiling'),
        e.ceil == null ? h('p', { style: { margin: 0, color: 'var(--muted)', fontSize: '.88rem' } }, 'No ceiling configured for this request, so the stage is skipped. Pick one under “Competitor ceiling” to see it fire.')
          : [line('ceiling', inr(Math.round(e.ceil))), h('div', { style: { marginTop: '8px' } }, e.ceilFired ? chip('FIRED: price capped to ' + inr(Math.round(e.ceil)), 'bad') : chip('PASS: under ceiling', 'ok'))]);
    }
    detail.replaceChildren(...b);
  }

  function sync() {
    FIELDS.forEach(f => { ins[f.k].value = q[f.k]; outs[f.k].textContent = f.f(q[f.k]); });
    R = engine({ ...q, ceilPct });
    const fired = [R.capFired && 'cap', R.floorFired && 'floor', R.ceilFired && 'ceil'];
    const marginNow = (q.price / q.cost - 1) * 100, marginNew = (R.price / q.cost - 1) * 100;
    result.replaceChildren(h('span.d-label', 'Recommendation'),
      h('div.prc-big', inr(R.price), h('small', { style: { fontSize: '1rem', marginLeft: '8px', color: R.pc >= 0 ? 'var(--green)' : 'var(--red)' } }, sg(R.pc) + '%')),
      h('div.d-note', { style: { margin: '2px 0 0' } }, 'from ' + inr(q.price)),
      verdict,
      line('Units', sg(R.units) + '%'), line('Revenue', sg(R.rev) + '%'),
      line('Margin over cost', `${marginNow.toFixed(1)}% → ${marginNew.toFixed(1)}%`),
      line('Days of supply', `${R.dos.toFixed(1)} → ${R.pdos.toFixed(1)}`),
      h('div', { style: { marginTop: '10px' } }, chip('Inventory risk: ' + R.risk, R.risk === 'HIGH' ? 'bad' : R.risk === 'MEDIUM' ? 'warn' : 'ok')));
    verdict.replaceChildren(...(fired.some(Boolean)
      ? [R.capFired && chip('±10% cap fired', 'warn'), R.floorFired && chip('Margin floor enforced', 'bad'), R.ceilFired && chip('Competitor ceiling enforced', 'bad')].filter(Boolean)
      : [chip('No guardrail fired', 'ok')]));
    stepBtns.forEach((b, i) => {
      const f = [false, false, R.capFired, R.floorFired, R.ceilFired][i];
      b.classList.toggle('prc-fired', f);
      b.querySelector('.chip').textContent = i < 2 ? 'always' : i === 4 && R.ceil == null ? 'off' : f ? 'fired' : 'pass';
    });
    renderDetail(st.index);
  }

  const flowHost = h('div');
  const left = h('div.d-card', h('span.d-label', 'Scenario & inputs (synthetic product)'), preBar, sliders);
  root.append(h('style', CSS),
    h('p.d-note', { style: { margin: '0 0 12px' } }, 'The same rule pipeline as the Java engine, run in the browser: weighted signals, then constraints applied in a fixed order. Click a stage to see its arithmetic. Deterministic, no ML.'),
    flowHost,
    h('div.d-split.prc-split', { style: { marginTop: '14px' } }, left, h('div', { style: { display: 'grid', gap: '14px', minWidth: 0, alignContent: 'start' } }, detail, result)),
    h('p.d-note', 'Elasticity −1.6: units% = demand% − 1.6 × price%; revenue% = (1+price%)(1+units%) − 1. Risk by projected days of supply: under 5 HIGH, under 15 MEDIUM, up to 60 LOW, up to 120 MEDIUM, above that HIGH.'));
  st = stepper(flowHost, STAGES.map(s => ({ ...s })), i => R && renderDetail(i));
  const stepBtns = [...flowHost.querySelectorAll('.d-step')];
  stepBtns.forEach(b => b.append(h('span.chip', '')));
  setScen(0);
  inView(root, null);
}
