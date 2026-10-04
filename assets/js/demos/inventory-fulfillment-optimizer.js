import { h, chip, inr, inView } from './_kit.js';

// Synthetic network: 6 warehouses, bundled stock for the 4 products used in the baskets below.
const W = [['W01', 'Mumbai', 19.076, 72.8777, 400], ['W02', 'Delhi', 28.7041, 77.1025, 450], ['W03', 'Bangalore', 12.9716, 77.5946, 350],
  ['W04', 'Chennai', 13.0827, 80.2707, 300], ['W05', 'Kolkata', 22.5726, 88.3639, 250], ['W06', 'Hyderabad', 17.385, 78.4867, 300]]
  .map(([id, city, lat, lon, cap]) => ({ id, city, lat, lon, cap }));
const P = {
  PR01: { n: 'TrailRunner X200 Running Shoe', kg: 0.8, s: [0, 13, 0, 48, 39, 58] },
  PR03: { n: 'SprintFlex Racer Shoe', kg: 0.75, s: [41, 6, 43, 24, 0, 6] },
  PR14: { n: 'ZenithWear Running Watch', kg: 0.09, s: [18, 0, 51, 5, 19, 0] },
  PR19: { n: 'AeroFit Windbreaker', kg: 0.35, s: [13, 31, 32, 5, 0, 32] },
};
const CITIES = { Mumbai: [19.076, 72.8777], Delhi: [28.7041, 77.1025], Bangalore: [12.9716, 77.5946], Chennai: [13.0827, 80.2707], Kolkata: [22.5726, 88.3639], Hyderabad: [17.385, 78.4867],
  Pune: [18.5204, 73.8567], Ahmedabad: [23.0225, 72.5714], Jaipur: [26.9124, 75.7873], Lucknow: [26.8467, 80.9462], Surat: [21.1702, 72.8311], Nagpur: [21.1458, 79.0882], Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126], Patna: [25.5941, 85.1376], Coimbatore: [11.0168, 76.9558], Kochi: [9.9312, 76.2673], Visakhapatnam: [17.6868, 83.2185], Chandigarh: [30.7333, 76.7794], Guwahati: [26.1445, 91.7362] };
const BASKETS = {
  A: [['PR01', 2], ['PR14', 1]],
  B: [['PR01', 20], ['PR03', 10], ['PR19', 6]],
};
const SCEN = [
  { label: 'Pune, SLA 3 days', city: 'Pune', sla: 3, b: 'A' },
  { label: 'Guwahati, SLA 2 days', city: 'Guwahati', sla: 2, b: 'A' },
  { label: 'Delhi bulk order (split)', city: 'Delhi', sla: 3, b: 'B' },
];
const BASE = 50, PERKM = 0.05, PERKG = 8, KMDAY = 500, PROC = 1, PEN = 100;
const OUTLINE = [[74.5, 36.5], [77.5, 35.5], [79, 34], [78.5, 32], [80.2, 30.6], [81, 30], [80, 28.8], [84.5, 27.3], [88, 27.2], [88.2, 26.4], [89.8, 26.3], [92, 26.8], [95, 27.7], [97.2, 28.3], [95.5, 26], [94.5, 24.2], [93.3, 22.8], [92.3, 24], [91.5, 25.2], [89.5, 25.2], [89, 22.2], [87, 21.5], [85, 19.8], [82.5, 17], [80.3, 15.5], [80.2, 13], [79.8, 10.3], [78.2, 8.4], [77.3, 8.1], [76.3, 9.8], [75, 12.5], [74, 15], [73.2, 17.5], [72.7, 20], [72.5, 21.5], [70.5, 20.8], [69, 22.3], [70, 23.7], [68.2, 23.7], [70, 25], [71, 27.5], [72.5, 30], [74.5, 31.5], [74.3, 33]];
const px = (lon, lat) => [((lon - 67.5) / 31) * 300, ((37.5 - lat) / 30.5) * 330];
const m2 = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rad = d => d * Math.PI / 180;
function hav(a, b, c, d) {
  const dp = rad(c - a), dl = rad(d - b);
  const x = Math.sin(dp / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dl / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const days = d => PROC + Math.ceil(d / KMDAY);
const stockOf = (wi, pid) => P[pid].s[wi];

function plan(city, items, sla) {
  const [la, lo] = CITIES[city];
  const kg = items.reduce((s, [p, q]) => s + P[p].kg * q, 0);
  const rows = W.map((w, wi) => {
    const short = items.filter(([p, q]) => stockOf(wi, p) < q).map(([p]) => p);
    const km = hav(la, lo, w.lat, w.lon), c = BASE + PERKM * km + PERKG * kg, dd = days(km);
    const late = Math.max(0, dd - sla), pen = PEN * late;
    return { w, wi, short, km: r1(km), kmRaw: km, cost: r2(c), d: dd, late, pen, score: r2(c + pen) };
  });
  const feas = rows.filter(r => !r.short.length).sort((a, b) => a.score - b.score);
  if (feas.length) { const best = feas[0]; return { kind: 'SINGLE', rows, best, kg, total: best.cost, d: best.d, met: best.d <= sla }; }
  const asg = new Map(); const bad = [];
  items.forEach(([p, q]) => {
    let bw = null, bd = Infinity;
    W.forEach((w, wi) => { if (stockOf(wi, p) < q) return; const d = hav(la, lo, w.lat, w.lon); if (d < bd) { bd = d; bw = wi; } });
    if (bw == null) bad.push(p); else { if (!asg.has(bw)) asg.set(bw, []); asg.get(bw).push([p, q]); }
  });
  if (bad.length) return { kind: 'INFEASIBLE', rows, bad };
  const ships = [...asg].map(([wi, its]) => {
    const w = W[wi], km = hav(la, lo, w.lat, w.lon), k = its.reduce((s, [p, q]) => s + P[p].kg * q, 0);
    return { w, wi, its, km: r1(km), kg: k, cost: r2(BASE + PERKM * km + PERKG * k), d: days(km) };
  });
  const d = Math.max(...ships.map(s => s.d));
  return { kind: 'SPLIT', rows, ships, kg, total: r2(ships.reduce((s, x) => s + x.cost, 0)), d, met: d <= sla };
}

const CSS = `.ful-pre{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.ful-pre .d-btn[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#06121e}
.ful-ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:6px}
.ful-ctl select{width:100%;background:var(--bg);color:var(--text);border:1px solid var(--line2);border-radius:8px;padding:9px 11px;font:.9rem var(--sans)}
.ful-ctl label{font-size:.78rem;color:var(--muted);display:block;margin-bottom:4px}
.ful-map path.o{fill:var(--surface2);stroke:var(--line2);stroke-width:1}
.ful-map .lnk{fill:none;stroke-width:2.2}
.ful-map .lnk.dim{stroke:var(--line2);stroke-dasharray:4 4;stroke-width:1.3}
.ful-map .lnk.ok{stroke:var(--green)}.ful-map .lnk.late{stroke:var(--red)}
.ful-map text{font:9.5px var(--sans);fill:var(--muted)}
.ful-map text.hi{fill:var(--text);font-weight:600}
.ful-map text.dst{fill:var(--amber-lt);font-weight:600}
.ful-row-win td{background:rgba(98,196,142,.08)}
.ful-dim td{color:var(--faint)}
.ful-line{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line);font-size:.85rem}
.ful-line b{font:500 .83rem var(--mono);text-align:right}`;

export function mount(root) {
  const NS = 'http://www.w3.org/2000/svg';
  const sel = { city: 'Pune', sla: 3, b: 'A' };
  const preBtns = [];
  const mapHost = h('div.d-card'), tableHost = h('div.d-card'), costHost = h('div.d-card.hl'), headHost = h('div');

  const citySel = h('select', { id: 'ful-city', onchange: e => { sel.city = e.target.value; clearPre(); sync(); } },
    Object.keys(CITIES).sort().map(c => h('option', { value: c }, c)));
  const slaSel = h('select', { id: 'ful-sla', onchange: e => { sel.sla = +e.target.value; clearPre(); sync(); } },
    [1, 2, 3, 4, 5, 6, 7].map(d => h('option', { value: d }, d + (d === 1 ? ' day' : ' days'))));
  const basketSel = h('select', { id: 'ful-bk', onchange: e => { sel.b = e.target.value; clearPre(); sync(); } },
    h('option', { value: 'A' }, 'Basket A: 2 shoes + 1 watch'), h('option', { value: 'B' }, 'Basket B: bulk, 3 products'));
  const preBar = h('div.ful-pre', { role: 'group', 'aria-label': 'Scenarios' }, SCEN.map((s, i) => {
    const b = h('button.d-btn', { type: 'button', 'aria-pressed': 'false', onclick: () => setScen(i) }, s.label); preBtns[i] = b; return b;
  }));
  const clearPre = () => preBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
  function setScen(i) { Object.assign(sel, { city: SCEN[i].city, sla: SCEN[i].sla, b: SCEN[i].b }); sync(); clearPre(); preBtns[i].setAttribute('aria-pressed', 'true'); }

  const svgEl = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };

  function drawMap(R) {
    const svg = svgEl('svg', { viewBox: '0 0 300 330', class: 'd-svg ful-map', role: 'img', 'aria-label': 'Schematic map of India: warehouses, destination and chosen route' });
    svg.append(svgEl('path', { class: 'o', d: 'M' + OUTLINE.map(([lo, la]) => px(lo, la).map(v => v.toFixed(1)).join(' ')).join('L') + 'Z' }));
    const [dx, dy] = px(CITIES[sel.city][1], CITIES[sel.city][0]);
    const chosen = R.kind === 'SINGLE' ? [R.best.wi] : R.kind === 'SPLIT' ? R.ships.map(s => s.wi) : [];
    const lateOne = R.kind !== 'INFEASIBLE' && !R.met;
    W.forEach((w, wi) => {
      const [x, y] = px(w.lon, w.lat);
      svg.append(svgEl('path', { class: 'lnk ' + (chosen.includes(wi) ? (lateOne ? 'late' : 'ok') : 'dim'), d: `M${x.toFixed(1)} ${y.toFixed(1)}L${dx.toFixed(1)} ${dy.toFixed(1)}` }));
    });
    W.forEach((w, wi) => {
      const [x, y] = px(w.lon, w.lat), on = chosen.includes(wi);
      const east = x < 200;
      svg.append(svgEl('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, fill: on ? 'var(--blue)' : 'var(--surface)', stroke: 'var(--blue)', 'stroke-width': 1.6 }),
        svgEl('text', { x: east ? x + 9 : x - 9, y: y + 3, 'text-anchor': east ? 'start' : 'end', class: on ? 'hi' : '' }, w.city));
    });
    const lbl = svgEl('text', { x: dx + (dx > 200 ? -9 : 9), y: dy - 7, 'text-anchor': dx > 200 ? 'end' : 'start', class: 'dst' }, sel.city);
    svg.append(svgEl('circle', { cx: dx, cy: dy, r: 6, fill: 'var(--amber)', stroke: 'var(--bg)', 'stroke-width': 1.5 }), lbl);
    mapHost.replaceChildren(h('span.d-label', 'Network (schematic lat/lon projection, not to scale)'), svg,
      h('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '.76rem', color: 'var(--muted)' } },
        h('span', '■ warehouse'), h('span', { style: { color: 'var(--amber-lt)' } }, '● destination'), h('span', { style: { color: 'var(--green)' } }, '— SLA met'), h('span', { style: { color: 'var(--red)' } }, '— SLA missed'), h('span', '- - not chosen')));
  }

  const line = (a, b) => h('div.ful-line', h('span', a), h('b', b));

  function sync() {
    citySel.value = sel.city; slaSel.value = sel.sla; basketSel.value = sel.b;
    const items = BASKETS[sel.b];
    const R = plan(sel.city, items, sel.sla);
    drawMap(R);
    const basket = items.map(([p, q]) => `${q}× ${P[p].n}`).join(' + ');
    // header
    headHost.replaceChildren(h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', margin: '4px 0 12px' } },
      chip(R.kind === 'SINGLE' ? 'SINGLE_WAREHOUSE' : R.kind, 'info'),
      R.kind !== 'INFEASIBLE' ? chip(R.met ? 'SLA MET' : 'SLA MISSED', R.met ? 'ok' : 'bad') : null,
      h('span', { style: { color: 'var(--muted)', fontSize: '.85rem' } }, `${basket} → ${sel.city}, SLA ${sel.sla}d`)));

    // table
    if (R.kind === 'SPLIT') {
      tableHost.replaceChildren(h('span.d-label', 'No single warehouse holds the whole basket: split'),
        h('p', { style: { fontSize: '.86rem', color: 'var(--muted)', margin: '0 0 10px' } }, 'Fallback: each line item goes to the nearest warehouse that can supply its full quantity; overall days = the slowest shipment. Greedy per item: it does not search for the cheapest combination.'),
        h('div.d-scroll', h('table.d-table', h('thead', h('tr', ['Ships from', 'Items', 'km', 'Days', 'Cost'].map(t => h('th', t)))),
          h('tbody', R.ships.map(s => h('tr', h('td', s.w.city), h('td', s.its.map(([p, q]) => `${q}× ${P[p].n}`).join(', ')), h('td.num', s.km.toLocaleString('en-IN')), h('td.num', s.d), h('td.num', m2(s.cost))))),
          h('tfoot', h('tr', h('td', { colspan: 3 }, 'Total (days = max)'), h('td.num', R.d), h('td.num', m2(R.total)))))));
      costHost.replaceChildren(h('span.d-label', 'Result'), line('Strategy', 'SPLIT, ' + R.ships.length + ' shipments'), line('Total shipping cost', m2(R.total)),
        line('Delivery days', R.d + ' (SLA ' + sel.sla + ')'), line('SLA', R.met ? 'MET' : 'MISSED'),
        h('p.d-note', 'The split path adds each shipment’s own ₹50 base fee, and it does not apply the late penalty when choosing.'));
    } else if (R.kind === 'INFEASIBLE') {
      tableHost.replaceChildren(h('span.d-label', 'Infeasible'), h('p', 'No warehouse can fully supply at least one line item.'));
      costHost.replaceChildren();
    } else {
      const sorted = [...R.rows].sort((a, b) => (a.short.length - b.short.length) || (a.score - b.score));
      tableHost.replaceChildren(h('span.d-label', 'Candidates scored: cost + ₹100 × days late (lowest wins)'),
        h('div.d-scroll', h('table.d-table', h('thead', h('tr', ['Warehouse', 'km', 'Days', 'Cost', 'Late', 'Score'].map(t => h('th', t)))),
          h('tbody', sorted.map(r => r.short.length
            ? h('tr.ful-dim', h('td', r.w.city), h('td', { colspan: 5 }, 'out of stock: ' + r.short.map(p => P[p].n).join(', ')))
            : h('tr' + (r === R.best ? '.ful-row-win' : ''), h('td', r.w.city + (r === R.best ? ' (chosen)' : '')), h('td.num', r.km.toLocaleString('en-IN')), h('td.num', r.d),
              h('td.num', m2(r.cost)), h('td.num', r.late ? `${r.late}d = ${inr(r.pen)}` : 'none'), h('td.num', m2(r.score))))))));
      const b = R.best;
      costHost.replaceChildren(h('span.d-label', 'Why ' + b.w.city + ': the arithmetic'),
        line(`₹50 + ₹0.05 × ${b.km} km + ₹8 × ${R.kg.toFixed(2)} kg`, m2(b.cost)),
        line(`days = 1 + ceil(${b.km} / 500)`, b.d + ' days'),
        line(`late by ${b.late} day${b.late === 1 ? '' : 's'} × ₹100`, b.late ? inr(b.pen) : '₹0'),
        line('score = cost + penalty', m2(b.score)),
        h('div', { style: { marginTop: '10px' } }, chip(b.d <= sel.sla ? 'SLA met' : 'SLA missed: ' + b.d + 'd vs ' + sel.sla + 'd promised', b.d <= sel.sla ? 'ok' : 'bad')));
    }
  }

  root.append(h('style', CSS),
    h('p.d-note', { style: { margin: '0 0 12px' } }, 'Synthetic network: 6 warehouses, real Haversine distances over real city coordinates. Each candidate warehouse that holds the full basket is scored on shipping cost plus an SLA lateness penalty; the cheapest score wins.'),
    h('div.d-card', h('span.d-label', 'Order'), preBar,
      h('div.ful-ctl', h('div', h('label', { for: 'ful-city' }, 'Deliver to'), citySel), h('div', h('label', { for: 'ful-sla' }, 'SLA promise'), slaSel), h('div', h('label', { for: 'ful-bk' }, 'Basket'), basketSel))),
    headHost,
    h('div.d-split', mapHost, h('div', { style: { display: 'grid', gap: '14px', minWidth: 0, alignContent: 'start' } }, costHost, tableHost)),
    h('p.d-note', 'Honest limits: warehouse capacity (units/day) exists in the data but is not enforced; this is a greedy rule-based planner, not an LP/optimisation solver. Cost = ₹50 + ₹0.05/km + ₹8/kg; days = 1 + ceil(km/500).'));
  setScen(0);
  inView(root, null);
}
