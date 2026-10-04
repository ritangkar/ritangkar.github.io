import { h, chip, inr, inView, reduced } from './_kit.js';

// Real artifact: from-scratch logistic regression (Java trainer), committed weights, not retrained in the browser.
const M = {
  names: ['tenure_months', 'monthly_spend', 'support_tickets_last_90d', 'days_since_last_order', 'discount_usage_rate', 'nps_score', 'is_subscribed'],
  means: [29.908333333333335, 3134.1107222222213, 1.1097222222222223, 90.57777777777778, 0.508236111111111, 5.030555555555556, 0.4361111111111111],
  stds: [17.0040824346521, 1640.556354997709, 1.0262742380710899, 52.45569088452502, 0.2899249420614257, 3.2457938118641763, 0.49590141144843086],
  w: [-0.5407, -0.5361, 0.2736, 0.9097, 0.1496, -0.6952, -0.0091],
  b: -0.5829,
};
const F = [
  { k: 'tenure_months', label: 'Tenure (months)', min: 1, max: 60, step: 1, fmt: v => v },
  { k: 'monthly_spend', label: 'Monthly spend', min: 200, max: 6000, step: 50, fmt: inr },
  { k: 'support_tickets_last_90d', label: 'Support tickets (90d)', min: 0, max: 8, step: 1, fmt: v => v },
  { k: 'days_since_last_order', label: 'Days since last order', min: 1, max: 180, step: 1, fmt: v => v },
  { k: 'discount_usage_rate', label: 'Discount usage rate', min: 0, max: 1, step: 0.05, fmt: v => v.toFixed(2) },
  { k: 'nps_score', label: 'NPS score (0-10)', min: 0, max: 10, step: 1, fmt: v => v },
  { k: 'is_subscribed', label: 'Subscribed', bool: true },
];
const PRESETS = [
  { id: 'def', label: 'Default customer', v: [12, 1800, 2, 45, 0.4, 5, 0] },
  { id: 'risk', label: 'At-risk customer', v: [3, 600, 5, 120, 0.8, 2, 0] },
  { id: 'loyal', label: 'Loyal customer', v: [48, 5000, 0, 10, 0.2, 9, 1] },
];
const sig = z => 1 / (1 + Math.exp(-z));
const level = p => (p < 0.3 ? 'LOW' : p < 0.6 ? 'MEDIUM' : 'HIGH');
const LC = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red' };
const CSS = `.chn-g{width:100%;max-width:300px;margin:0 auto;display:block}
.chn-needle{transition:transform .7s cubic-bezier(.2,.7,.2,1);transform-origin:100px 100px}
.chn-r{display:grid;grid-template-columns:minmax(110px,170px) 1fr 4.6em;gap:10px;align-items:center;margin:7px 0;font-size:.84rem}
.chn-r small{display:block;color:var(--faint);font:.7rem var(--mono)}
.chn-track{position:relative;height:12px;background:var(--surface2);border-radius:6px}
.chn-track::after{content:"";position:absolute;left:50%;top:-3px;bottom:-3px;width:1px;background:var(--line2)}
.chn-fill{position:absolute;top:0;bottom:0;border-radius:6px;transition:left .5s,width .5s}
.chn-fill.up{background:var(--red)}.chn-fill.dn{background:var(--green)}
.chn-v{font:.78rem var(--mono);text-align:right}
.chn-sl{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin-bottom:9px;font-size:.82rem}
.chn-sl input[type=checkbox]{justify-self:start;width:20px;height:20px;accent-color:var(--blue)}.chn-sl input[type=range]{grid-column:1/-1;width:100%;accent-color:var(--blue)}
.chn-sl output{font:.8rem var(--mono);color:var(--amber-lt)}
.chn-pre{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.chn-pre .d-btn[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#06121e}
@media(max-width:520px){.chn-r{grid-template-columns:1fr 4.6em}.chn-track{grid-column:1/-1;order:3}}`;

export function mount(root) {
  const inputs = [];
  const outs = [];
  const rows = [];
  const preBtns = [];

  // gauge
  const pt = (p, r) => { const a = Math.PI * (1 - p); return [100 + r * Math.cos(a), 100 - r * Math.sin(a)]; };
  const arc = (p0, p1, cls) => {
    const [x0, y0] = pt(p0, 80), [x1, y1] = pt(p1, 80);
    return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A80 80 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="var(--${cls})" stroke-width="14" opacity=".85"/>`;
  };
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 122'); svg.setAttribute('class', 'chn-g d-svg');
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Churn probability gauge');
  svg.innerHTML = arc(0, 0.3, 'green') + arc(0.3, 0.6, 'amber') + arc(0.6, 1, 'red') +
    '<g class="chn-needle" id="needle"><line x1="100" y1="100" x2="100" y2="34" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/></g><circle cx="100" cy="100" r="6" fill="var(--text)"/>' +
    '<text class="m" x="14" y="116" text-anchor="middle">0</text><text class="m" x="186" y="116" text-anchor="middle">1</text>' +
    `<text class="m" x="${pt(0.3, 94)[0].toFixed(1)}" y="${pt(0.3, 94)[1].toFixed(1)}" text-anchor="end">0.30</text><text class="m" x="${pt(0.6, 94)[0].toFixed(1)}" y="${pt(0.6, 94)[1].toFixed(1)}" text-anchor="start">0.60</text>`;
  const needle = svg.querySelector('#needle');

  const pVal = h('div.d-stat', '0');
  const lvl = h('span');
  const zLine = h('div.d-note', { style: { marginTop: '8px' } });
  const top3 = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' } });

  // sliders
  const sliders = F.map((f, i) => {
    const id = 'chn-' + f.k;
    const out = h('output', { for: id });
    outs[i] = out;
    let inp;
    if (f.bool) inp = h('input', { type: 'checkbox', id, onchange: () => { sync(); clearPre(); } });
    else inp = h('input', { type: 'range', id, min: f.min, max: f.max, step: f.step, oninput: () => { sync(); clearPre(); } });
    inputs[i] = inp;
    return h('div.chn-sl', h('label', { for: id }, f.label), out, inp);
  });

  // contribution rows
  const contribs = F.map((f, i) => {
    const fill = h('i.chn-fill');
    const v = h('span.chn-v');
    const zs = h('small');
    const r = h('div.chn-r', h('span', f.label, zs), h('div.chn-track', fill), v);
    rows[i] = { fill, v, zs };
    return r;
  });

  const preBar = h('div.chn-pre', { role: 'group', 'aria-label': 'Preset customers' }, PRESETS.map((p, i) => {
    const b = h('button.d-btn', { type: 'button', 'aria-pressed': 'false', onclick: () => setPreset(i) }, p.label);
    preBtns[i] = b; return b;
  }));

  function clearPre() { preBtns.forEach(b => b.setAttribute('aria-pressed', 'false')); }
  function setPreset(i) {
    PRESETS[i].v.forEach((val, j) => { if (F[j].bool) inputs[j].checked = !!val; else inputs[j].value = val; });
    sync(); clearPre(); preBtns[i].setAttribute('aria-pressed', 'true');
  }

  function sync() {
    const raw = F.map((f, i) => (f.bool ? (inputs[i].checked ? 1 : 0) : +inputs[i].value));
    let z = M.b;
    const cs = raw.map((x, i) => {
      const zs = (x - M.means[i]) / M.stds[i];
      const c = M.w[i] * zs; z += c;
      return { i, zs, c };
    });
    const p = sig(z), lv = level(p);
    pVal.textContent = p.toFixed(4);
    pVal.className = 'd-stat ' + (lv === 'HIGH' ? 'bad' : lv === 'LOW' ? 'good' : 'amber');
    lvl.replaceChildren(chip(lv + ' RISK', LC[lv] === 'red' ? 'bad' : LC[lv] === 'green' ? 'ok' : 'warn'));
    needle.style.transform = `rotate(${(-90 + 180 * p).toFixed(1)}deg)`;
    zLine.textContent = `z = ${M.b} + Σ(w·z-score) = ${z.toFixed(4)}  →  p = 1 / (1 + e^−z) = ${p.toFixed(4)}`;
    cs.forEach(({ i, zs, c }) => {
      const f = F[i];
      outs[i].textContent = f.bool ? (raw[i] ? 'yes' : 'no') : f.fmt(raw[i]);
      const half = Math.min(50, Math.abs(c) / 1.6 * 50);
      const fl = rows[i].fill;
      fl.className = 'chn-fill ' + (c >= 0 ? 'up' : 'dn');
      fl.style.left = (c >= 0 ? 50 : 50 - half) + '%'; fl.style.width = half + '%';
      rows[i].v.textContent = (c >= 0 ? '+' : '−') + Math.abs(c).toFixed(2);
      rows[i].v.style.color = c >= 0 ? 'var(--red)' : 'var(--green)';
      rows[i].zs.textContent = `w ${M.w[i] > 0 ? '+' : '−'}${Math.abs(M.w[i]).toFixed(4)} × z ${zs >= 0 ? '+' : '−'}${Math.abs(zs).toFixed(2)}`;
    });
    top3.replaceChildren(h('span.d-label', { style: { margin: 0, alignSelf: 'center' } }, 'Top factors'),
      ...cs.slice().sort((a, b) => Math.abs(b.c) - Math.abs(a.c)).slice(0, 3).map(({ i, c }) =>
        chip(`${F[i].label.replace(/ \(.*\)/, '')} ${c >= 0 ? '+' : '−'}${Math.abs(c).toFixed(2)}`, c >= 0 ? 'bad' : 'ok')));
  }

  const gaugeCard = h('div.d-card.hl', h('span.d-label', 'Churn probability'), svg,
    h('div', { style: { textAlign: 'center', marginTop: '-6px' } }, pVal, h('div', { style: { marginTop: '6px' } }, lvl)), top3, zLine);
  const left = h('div', h('div.d-card', h('span.d-label', 'Customer profile (drag to recompute live)'), preBar, sliders));
  const right = h('div', { style: { display: 'grid', gap: '14px', minWidth: 0 } }, gaugeCard,
    h('div.d-card', h('span.d-label', 'Signed contribution = weight × standardised value'),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', font: '.7rem var(--mono)', color: 'var(--faint)' } }, h('span', '← lowers risk'), h('span', 'raises risk →')), contribs));

  root.append(h('style', CSS),
    h('p.d-note', { style: { margin: '0 0 12px' } }, 'A real, from-scratch logistic regression: 7 z-score-standardised features, weights committed from an offline Java trainer (900 synthetic rows, 73.3% test accuracy, 91.7% recall). Not retrained in the browser; the formula is tiny, so the sliders run it live.'),
    h('div.d-split', left, right),
    h('p.d-note', 'Risk bands: below 0.30 LOW, below 0.60 MEDIUM, otherwise HIGH. Synthetic data. Classical ML, no LLM.'));
  setPreset(0);
  inView(root, null);
}
