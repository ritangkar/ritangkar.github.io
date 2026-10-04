import { h, tabs, chip, barRow as _barRow, reduced } from './_kit.js';

const barRow = (l, p, t, v) => { const r = _barRow(l, p, t, v); r.querySelector('.bar').style.setProperty('--w', Math.max(0, Math.min(100, p)) + '%'); return r; }; // kit barRow drops the --w custom property

// Four REAL measured comparisons from the repo's /benchmarks scripts. Numbers shown exactly as recorded.
// bars: [label, value in a common unit, display text, variant]
const C = [
  { id: 'indexing', label: 'Indexing', method: 'SQLite proof-of-concept · 100,000 rows · 200 lookups', x: '≈486×', xs: 'faster per lookup',
    bars: [['Full table SCAN', 3.03, '3.03 ms', 'red'], ['Indexed SEARCH', 0.006, '0.006 ms', 'green']],
    code: 'EXPLAIN QUERY PLAN\n  before: SCAN orders\n  after : SEARCH orders USING INDEX idx_customer_status',
    note: 'The 486× figure is the recorded ratio; the 0.006 ms mean is rounded, so dividing the two displayed numbers gives a slightly different quotient.' },
  { id: 'caching', label: 'Caching', method: 'Plain Java · Caffeine · 30 unique products · 300 requests', x: '≈9.7×', xs: 'faster per request',
    bars: [['No cache', 100.18, '100.18 ms', 'red'], ['Caffeine cache', 10.36, '10.36 ms', 'green']],
    code: '30 cold misses × 100.18 ms ≈ 3,005 ms\n3,005 ms ÷ 300 requests     ≈ 10.0 ms / request',
    note: 'Matches theory almost exactly: only the 30 unique products ever pay the 100 ms cost; the other 270 requests are hits. (Arithmetic above is derived from the measured numbers.)' },
  { id: 'pagination', label: 'Pagination', method: '50,000-product catalogue · hand-serialised JSON', x: '≈2,582×', xs: 'smaller payload',
    groups: [['Payload size', [['Return everything', 8.4e6, '8.4 MB', 'red'], ['Paginated, size = 20', 3.4e3, '3.4 KB', 'green']]], ['Serialisation time', [['Return everything', 183.5, '183.5 ms', 'red'], ['Paginated, size = 20', 0.06, '0.06 ms', 'green']]]],
    note: 'Not a marginal win: at this catalogue size pagination is close to a strict improvement, on bytes and on CPU time.' },
  { id: 'concurrency', label: 'Concurrency', method: '60,000 synthetic orders · sequential vs parallel stream', x: '1.29×', xs: 'faster, on ONE core', honest: true, linear: true,
    bars: [['Sequential', 629.3, '629.3 ms', 'red'], ['Parallel stream', 489.6, '489.6 ms', 'green']],
    note: 'Honest reading: the test environment exposed only 1 CPU core, so this speedup is modest and is not evidence of how the workload scales on multi-core hardware. It is reported as measured rather than as a flattering number.' },
];

const CSS = `.apl .chip{white-space:normal}
.apl .big{font-size:clamp(2.2rem,8vw,3.6rem);font-weight:700;letter-spacing:-.04em;line-height:1;color:var(--green)}
.apl .big.w{color:var(--amber-lt)}`;

export function mount(root) {
  let log = true;
  root.append(h('style', CSS));
  const wrap = h('div.apl'); root.append(wrap);
  tabs(wrap, C.map(c => ({ id: c.id, label: c.label, render: p => view(p, c) })), 'indexing');

  function view(p, c) {
    const useLog = log && !c.linear;
    const scale = (list) => {
      const vals = list.map(b => b[1]), mx = Math.max(...vals), mn = Math.min(...vals), fl = mn / 3;
      return b => useLog ? Math.max(5, 100 * Math.log(b[1] / fl) / Math.log(mx / fl)) : Math.max(1.2, 100 * b[1] / mx);
    };
    const groups = c.groups || [[null, c.bars]];
    const bars = h('div.d-card');
    groups.forEach(([t, list]) => { const s = scale(list); if (t) bars.append(h('span.d-label', { style: { marginTop: '8px' } }, t)); list.forEach(b => bars.append(barRow(b[0], s(b), b[2], b[3]))); });
    const ctl = h('div.d-ctl', { style: { marginTop: 0 } }, chip(c.method, 'info'), c.honest ? chip('1 CPU core · honest result', 'warn') : null,
      c.linear ? chip('linear scale', '') : h('button.d-btn', { type: 'button', 'aria-pressed': String(log), onclick: () => { log = !log; p.classList.remove('is-in'); p.replaceChildren(); view(p, c); requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('is-in'))); } }, log ? 'Log scale · switch to linear' : 'Linear scale · switch to log'));
    p.append(ctl, h('div.d-split',
      h('div.d-card', h('span.d-label', 'Speed-up'), h('div.big' + (c.honest ? '.w' : ''), c.x), h('p.d-note', { style: { marginTop: '8px' } }, c.xs)),
      h('div', bars, !c.linear && h('p.d-note', { style: { marginTop: '8px' } }, log ? 'Bars use a log scale so the small value stays visible; the exact numbers are printed.' : 'Linear scale: the small bar is almost invisible, which is exactly why log is the default here.'))),
      c.code ? h('pre.d-code', { style: { marginTop: '14px' } }, c.code) : null,
      h('div.d-card' + (c.honest ? '.ai' : ''), { style: { marginTop: '14px' } }, h('span.d-label', c.honest ? 'Read this honestly' : 'Takeaway'), h('p', { style: { margin: 0, fontSize: '.9rem' } }, c.note)));
    if (reduced) p.classList.add('is-in');
  }
}
