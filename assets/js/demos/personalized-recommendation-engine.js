import { h, chip, inView } from './_kit.js';

// Real output of the hybrid recommender over the synthetic data (160 customers, 1,102 purchases, 124 products).
// rec = [name, color, hybrid score, popularity part, content part, collaborative part, driver item]
const DATA = {"CUST0009":{"hist":["StrideMax Surge 207 (Red)|Footwear","ZenithWear Drift 158 (Red)|Footwear","ThermoLayer Running Jacket (Red)|Apparel","PacePro Heart Rate Monitor (Black)|Electronics"],"recs":[["ThermoLayer Compression Tights","White",0.947,0.147,0.4,0.4,"ThermoLayer Running Jacket (Red)"],["CoreFit Heart Rate Monitor","White",0.818,0.158,0.26,0.4,"PacePro Heart Rate Monitor (Black)"],["ZenithWear Base Layer","Navy",0.741,0.147,0.26,0.333,"ZenithWear Drift 158 (Red)"],["ZenithWear Drift 271","Black",0.74,0.074,0.4,0.267,"ZenithWear Drift 158 (Red)"],["StrideMax Surge 677","White",0.68,0.074,0.34,0.267,"StrideMax Surge 207 (Red)"]]},"CUST0001":{"hist":["SprintFlex Velocity 955 (Navy)|Footwear","HydroFlow Sports Cap (Grey)|Accessories","SolarCap Water Bottle (Grey)|Accessories","AeroFit Base Layer (Grey)|Apparel","PacePro Wireless Earbuds (Black)|Electronics","CoreFit Wireless Earbuds (White)|Electronics","PacePro Drift 400 (Black)|Footwear","CoreFit Running Watch (White)|Electronics"],"recs":[["HydroFlow Running Backpack","Blue",0.947,0.147,0.4,0.4,"HydroFlow Sports Cap (Grey)"],["HydroFlow Running Backpack","Black",0.947,0.147,0.4,0.4,"HydroFlow Sports Cap (Grey)"],["GripFit Sports Cap","Grey",0.92,0.2,0.32,0.4,"SolarCap Water Bottle (Grey)"],["SolarCap Water Bottle","Orange",0.892,0.137,0.4,0.356,"SolarCap Water Bottle (Grey)"],["CoreFit Heart Rate Monitor","White",0.869,0.158,0.4,0.311,"CoreFit Wireless Earbuds (White)"]]},"CUST0042":{"hist":["TrailBlazer Camp Stove (Orange)|Outdoor Gear","TrailBlazer Camp Stove (Green)|Outdoor Gear","RapidTread Pulse 230 (White)|Footwear","PacePro Momentum 963 (Black)|Footwear","BaseCamp Sleeping Bag (Grey)|Outdoor Gear","NorthPeak Camp Stove (Green)|Outdoor Gear"],"recs":[["TrailBlazer Tent 2P","Grey",0.716,0.116,0.4,0.2,"TrailBlazer Camp Stove (Green)"],["NorthPeak Trekking Poles","Green",0.71,0.137,0.34,0.233,"NorthPeak Camp Stove (Green)"],["TrailBlazer Ridge Boot","Black",0.707,0.147,0.16,0.4,"TrailBlazer Camp Stove (Orange)"],["NorthPeak Trekking Poles","Grey",0.7,0.126,0.34,0.233,"NorthPeak Camp Stove (Green)"],["BaseCamp Sleeping Bag","Green",0.656,0.116,0.34,0.2,"BaseCamp Sleeping Bag (Grey)"]]}};
const W = { pop: 0.2, con: 0.4, col: 0.4 };
const COL = { pop: 'var(--muted)', con: 'var(--blue)', col: 'var(--green)' };
const NAMES = { pop: 'Popularity', con: 'Content-based', col: 'Collaborative' };
const CSS = `.rec .stk{display:flex;height:12px;border-radius:999px;overflow:hidden;background:var(--surface2)}
.rec .stk i{display:block;height:100%}
.rec .ri{display:block;width:100%;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;margin:8px 0;color:var(--text);font:inherit;cursor:pointer}
.rec .ri[aria-pressed=true]{border-color:var(--blue);background:#14202e}
.rec .ri .t{display:flex;justify-content:space-between;gap:10px;font-size:.9rem;font-weight:600;margin-bottom:8px}
.rec .ri .t span:last-child{font:.82rem var(--mono);color:var(--amber-lt)}
.rec .hi{padding:8px 10px;border:1px solid var(--line);border-radius:8px;margin:6px 0;font-size:.86rem;display:flex;justify-content:space-between;gap:8px}
.rec .hi.drv{border-color:var(--blue);background:#14202e}.rec .hi small{color:var(--faint);font-family:var(--mono)}
.rec .lg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.78rem;color:var(--muted);margin:10px 0}.rec .lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}`;
const top = r => (r[4] >= r[3] && r[4] >= r[5]) ? 'con' : (r[5] >= r[3] && r[5] >= r[4]) ? 'col' : 'pop';

export function mount(root) {
  const el = h('div.rec', h('style', CSS)); root.append(el);
  let cust = 'CUST0009', sel = 0;
  const pick = h('div.d-ctl', { role: 'group', 'aria-label': 'Choose a synthetic customer' });
  const hist = h('div'), recs = h('div'), why = h('div.d-card.hl');
  const weights = h('div.d-grid', ['pop', 'con', 'col'].map(k => h('div.d-card', h('span.d-label', NAMES[k] + ' · weight ' + W[k]),
    h('div', { style: { height: '4px', background: COL[k], borderRadius: '2px', width: (W[k] / .4 * 100) + '%', marginBottom: '8px' } }),
    h('p', { style: { margin: 0, fontSize: '.82rem', color: 'var(--muted)' } }, {
      pop: 'How often each product was purchased across all customers, divided by the max.',
      con: 'Best item-item similarity to anything owned: category .40 + brand .20 + use case .25 + price bucket .15.',
      col: 'Co-purchase matrix: how often other customers bought the candidate with each item you own, summed.' }[k]))));
  el.append(h('div.d-ctl', chip('Synthetic customers', 'info'), chip('Classic recsys · no embeddings, no LLM', 'ok')), h('span.d-label', 'Customer'), pick,
    h('div.d-split', h('div', h('span.d-label', '1 · Purchase history'), hist), h('div', h('span.d-label', '3 · Hybrid = 0.2·pop + 0.4·content + 0.4·collab'), recs)),
    h('span.d-label', { style: { marginTop: '16px' } }, '2 · Three signals, each min-max normalised to 0–1'), weights,
    h('div.lg', ['pop', 'con', 'col'].map(k => h('span', h('i', { style: { background: COL[k] } }), NAMES[k] + ' (weighted)'))), why,
    h('p.d-note', 'Already-purchased products are excluded. The label shown is the signal that contributed most to that product\'s score; the explanation sentence cites the "driver" item behind it. Scores are real outputs for these customers.'));

  function draw() {
    const d = DATA[cust], r = d.recs[sel];
    pick.replaceChildren(...Object.keys(DATA).map(c => h('button.d-btn', { type: 'button', 'aria-pressed': String(c === cust), style: c === cust ? { borderColor: 'var(--blue)', color: 'var(--blue-lt)' } : null,
      onclick: () => { cust = c; sel = 0; draw(); } }, c)));
    hist.replaceChildren(...d.hist.map(x => { const [n, cat] = x.split('|'); return h('div.hi' + (n === r[6] ? '.drv' : ''), h('span', n), h('small', cat)); }));
    recs.replaceChildren(...d.recs.map((x, i) => h('button.ri', { type: 'button', 'aria-pressed': String(i === sel), onclick: () => { sel = i; draw(); } },
      h('div.t', h('span', (i + 1) + '. ' + x[0] + ' (' + x[1] + ')'), h('span', x[2].toFixed(3))),
      h('div.stk', { role: 'img', 'aria-label': 'popularity ' + x[3] + ', content ' + x[4] + ', collaborative ' + x[5] }, ['pop', 'con', 'col'].map((k, j) => h('i', { style: { width: (x[3 + j] * 100) + '%', background: COL[k] } }))))));
    const k = top(r), driverIsOwned = k !== 'pop';
    why.replaceChildren(h('span.d-label', 'Why #' + (sel + 1) + ' · ' + NAMES[k] + ' signal led'),
      h('p', { style: { margin: '0 0 8px', fontSize: '.95rem' } }, k === 'con' ? 'Recommended because you previously purchased ' + r[6] + '.' : k === 'col' ? 'Customers who bought ' + r[6] + ' also bought this.' : 'A popular choice among all customers.'),
      h('div.d-code', '0.2×pop + 0.4×content + 0.4×collab\n' + [r[3], r[4], r[5]].map((v, j) => ['pop', 'con', 'col'][j] + ' part ' + v.toFixed(3)).join('  +  ') + '  =  ' + r[2].toFixed(3)));
    if (driverIsOwned) why.append(h('p.d-note', { style: { marginTop: '8px' } }, 'The driver item is highlighted in the purchase history.'));
  }
  draw();
}
