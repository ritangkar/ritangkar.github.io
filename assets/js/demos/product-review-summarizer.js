// Review Summarizer — traceable review summary: every theme and complaint cites the exact reviews that triggered it.
// Counts are from executing the original over its bundled 80 synthetic reviews. Deterministic, no LLM, no network.
import { h, chip, barRow, inView } from './_kit.js';

const RV = `
R0002|5|The upper is breathable and the cushioning is top notch.
R0003|5|The upper is breathable and the cushioning is top notch.
R0004|5|These shoes are incredibly comfortable, the cushioning is perfect for long runs.
R0007|5|The fit is excellent and the cushioning is soft yet responsive.
R0008|5|Great value, comfortable and durable for the price.
R0009|5|Extremely comfortable for daily wear, cushioning holds up well.
R0012|5|The fit is excellent and the cushioning is soft yet responsive.
R0015|4|Great cushioning and support, my knees thank me after every run.
R0021|5|Really happy with the comfort and durability so far.
R0024|5|Really happy with the comfort and durability so far.
R0027|5|These shoes are incredibly comfortable, the cushioning is perfect for long runs.
R0033|5|Fantastic shoe, the breathability and cushioning make long runs easy.
R0038|4|Fantastic shoe, the breathability and cushioning make long runs easy.
R0039|4|Fantastic shoe, the breathability and cushioning make long runs easy.
R0041|5|The fit is excellent and the cushioning is soft yet responsive.
R0042|5|Great cushioning and support, my knees thank me after every run.
R0044|5|Really happy with the comfort and durability so far.
R0045|4|Great value, comfortable and durable for the price.
R0047|2|The sizing is really off, order a size bigger than usual.
R0048|2|I found the sizing inconsistent, my usual size was too tight.
R0051|2|The sole started peeling away from the upper within weeks.
R0052|1|Uncomfortable arch support, caused foot pain after long runs.
R0053|2|The shoe runs small in the toe box, uncomfortable after an hour.
R0054|2|The shoe runs small in the toe box, uncomfortable after an hour.
R0056|1|Uncomfortable arch support, caused foot pain after long runs.
R0057|1|Disappointed with the durability, wore out much faster than expected.
R0059|2|Sizing runs small, I had to return for a half size up.
R0060|1|The shoe runs small in the toe box, uncomfortable after an hour.
R0061|2|Uncomfortable arch support, caused foot pain after long runs.
R0062|2|The sizing is really off, order a size bigger than usual.
R0063|2|The sizing is really off, order a size bigger than usual.
R0064|1|Uncomfortable arch support, caused foot pain after long runs.
R0065|2|Started falling apart after a month of light use, poor quality.
R0066|1|Started falling apart after a month of light use, poor quality.
R0067|2|Disappointed with the durability, wore out much faster than expected.
R0070|2|The shoe runs small in the toe box, uncomfortable after an hour.
`;
const REV = Object.fromEntries(RV.trim().split('\n').map(l => { const [id, r, ...t] = l.split('|'); return [id, { r: +r, t: t.join('|') }]; }));
const IDS = s => s.split(' ');
const DIST = [[1, 8], [2, 17], [3, 10], [4, 16], [5, 29]];
// scopes: [mentions, cited sample ids]. Counts executed from the bundled 80-review dataset.
const THEMES = [
  { name: 'Comfort / cushioning', kw: ['comfort', 'comfortable', 'cushioning', 'cushion'], all: [60, IDS('R0039 R0027 R0009 R0004 R0056')], pos: [45, IDS('R0039 R0027 R0009 R0004 R0024')], neg: [10, IDS('R0056 R0054 R0060 R0061 R0070')] },
  { name: 'Sizing / fit', kw: ['sizing', 'size', 'fit', 'runs small', 'runs big'], all: [19, IDS('R0063 R0059 R0054 R0047 R0060')], pos: [3, IDS('R0041 R0007 R0012')], neg: [16, IDS('R0063 R0059 R0054 R0047 R0060')] },
  { name: 'Durability / quality', kw: ['durable', 'durability', 'quality', 'fell apart', 'wore out', 'stitching', 'peeling'], all: [13, IDS('R0024 R0021 R0057 R0065 R0045')], pos: [8, IDS('R0024 R0021 R0045 R0008 R0044')], neg: [5, IDS('R0057 R0065 R0066 R0051 R0067')] },
  { name: 'Breathability', kw: ['breathable', 'breathability'], all: [8, IDS('R0039 R0033 R0002 R0003 R0038')], pos: [8, IDS('R0039 R0033 R0002 R0003 R0038')], neg: [0, []] },
  { name: 'Support', kw: ['support', 'arch'], all: [6, IDS('R0056 R0042 R0061 R0052 R0064')], pos: [2, IDS('R0042 R0015')], neg: [4, IDS('R0056 R0061 R0052 R0064')] },
];
const COMPLAINTS = [
  { name: 'sizing', n: 10, ids: IDS('R0063 R0059 R0047 R0062 R0048') }, { name: 'runs small', n: 9, ids: IDS('R0059 R0054 R0060 R0070 R0053') },
  { name: 'arch support', n: 4, ids: IDS('R0056 R0061 R0052 R0064') }, { name: 'wore out', n: 2, ids: IDS('R0057 R0067') },
];
const SCOPES = [['all', 'All 80 reviews'], ['pos', 'Positive (4–5★) · 45'], ['neg', 'Negative (1–2★) · 25']];

const CSS = `.rs-hero{display:flex;gap:22px;align-items:center;flex-wrap:wrap}
.rs-hero .big{font-size:3.4rem;font-weight:700;letter-spacing:-.04em;line-height:1}
.rs-hist{flex:1 1 240px;min-width:0}.rs-hist .d-row{grid-template-columns:34px 1fr 28px;margin:5px 0}
.rs-hist .d-row .n{min-width:0}
@media(max-width:520px){.rs-hist .d-row{grid-template-columns:34px 1fr 28px}.rs-hist .d-row .bar{grid-column:auto;order:0}}
.rs-btn{display:grid;grid-template-columns:1fr auto;gap:4px 10px;width:100%;text-align:left;background:var(--surface);color:var(--text);border:1px solid var(--line);border-radius:var(--r);padding:9px 12px;margin:0 0 8px;font:inherit;cursor:pointer}
.rs-btn:hover{border-color:var(--line2)}.rs-btn[aria-pressed=true]{border-color:var(--blue);background:#14202e}.rs-btn .bar{grid-column:1/-1}
.rs-btn .n{font:.8rem var(--mono);color:var(--muted)}.rs-btn.z{opacity:.55}
.rs-seg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.rs-seg button[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#06121e}
.rs-rev{border-left:3px solid var(--line2);padding:6px 0 6px 12px;margin:0 0 10px;font-size:.88rem;overflow-wrap:anywhere}
.rs-rev.p{border-color:var(--green)}.rs-rev.n{border-color:var(--red)}.rs-rev .id{font:.74rem var(--mono);color:var(--faint);display:block}
.rs-rev mark{background:rgba(91,155,213,.25);color:var(--blue-lt);padding:0 2px;border-radius:3px}.rs-rev mark.w{background:rgba(229,166,79,.22);color:var(--amber-lt)}`;

export function mount(root) {
  let scope = 'all', pick = { type: 'theme', i: 1 };
  scope = 'neg';
  const themes = h('div'), cites = h('div.d-card.ai'), segs = h('div.rs-seg', { role: 'group', 'aria-label': 'Review scope' });
  const cl = h('div');

  const hl = (text, words, cls) => {
    const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|') + ')', 'ig');
    return text.split(re).map((p, i) => i % 2 ? h('mark' + (cls ? '.' + cls : ''), p) : p);
  };

  function draw() {
    segs.replaceChildren(...SCOPES.map(([k, l]) => h('button.d-btn', { type: 'button', 'aria-pressed': scope === k, onclick: () => { scope = k; draw(); } }, l)));
    const max = Math.max(...THEMES.map(t => t[scope][0]));
    themes.replaceChildren(...THEMES.slice().sort((a, b) => b[scope][0] - a[scope][0]).map(t => {
      const i = THEMES.indexOf(t);
      return h('button.rs-btn' + (t[scope][0] ? '' : '.z'), { type: 'button', 'aria-pressed': pick.type === 'theme' && pick.i === i, onclick: () => { pick = { type: 'theme', i }; draw(); } },
        h('span', t.name), h('span.n', t[scope][0] + ' mentions'),
        h('div.bar' + (scope === 'neg' ? '.red' : scope === 'pos' ? '.green' : '') + '.is-in', { style: { '--w': (t[scope][0] / max * 100) + '%' } }, h('i')));
    }));
    cl.replaceChildren(...COMPLAINTS.map((c, i) => h('button.rs-btn', { type: 'button', 'aria-pressed': pick.type === 'comp' && pick.i === i, onclick: () => { pick = { type: 'comp', i }; draw(); } },
      h('span', '“' + c.name + '”'), h('span.n', c.n + ' negative reviews'), h('div.bar.amber.is-in', { style: { '--w': (c.n / 10 * 100) + '%' } }, h('i')))));
    let title, count, ids, words, note;
    if (pick.type === 'theme') { const t = THEMES[pick.i]; title = t.name + ' · ' + SCOPES.find(s => s[0] === scope)[1]; [count, ids] = t[scope]; words = t.kw; }
    else { const c = COMPLAINTS[pick.i]; title = 'Complaint “' + c.name + '” (needs ≥ 2 negative reviews)'; count = c.n; ids = c.ids; words = [c.name]; }
    const tricky = pick.type === 'theme' && pick.i === 0 && scope === 'neg';
    cites.replaceChildren(h('span.d-label', 'Evidence trail · ' + title),
      h('p', { style: { margin: '0 0 10px', fontSize: '.88rem' } }, ids.length ? 'Cited ' + ids.length + ' of ' + count + ' matching reviews. The highlighted words are exactly why each one matched.' : 'No review in this scope matches, so nothing is cited.'),
      ids.map(id => { const r = REV[id]; return h('div.rs-rev.' + (r.r >= 4 ? 'p' : r.r <= 2 ? 'n' : ''), h('span.id', id + ' · ' + '★'.repeat(r.r) + ' (' + r.r + ')'), hl(r.t, words, pick.type === 'comp' ? 'w' : '')); }),
      tricky ? h('p.d-note', { style: { marginTop: '4px' } }, 'Honest limit: matching is substring-based, so “comfort” also fires inside “Uncomfortable”. That is why Comfort shows 10 mentions among negative reviews. A real sentiment model would not make that mistake; a dictionary does.') : null);
  }

  root.append(h('style', CSS),
    h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' } }, chip('Deterministic · no LLM', 'ai'), chip('80 synthetic reviews', 'info'), chip('keyword dictionary, not a sentiment model')),
    h('div.d-card.hl', h('div.rs-hero',
      h('div', h('span.d-label', 'Average rating'), h('div.big', '3.51'), h('div', { style: { margin: '6px 0 4px' } }, chip('Mostly Positive', 'info')),
        h('div.d-note', { style: { margin: 0, fontFamily: 'var(--mono)' } }, '281 ÷ 80 = 3.51 · rule: ≥4 Positive, ≥3 Mostly Positive')),
      h('div.rs-hist', { role: 'img', 'aria-label': 'Rating distribution: 1 star 8, 2 stars 17, 3 stars 10, 4 stars 16, 5 stars 29' },
        [5, 4, 3, 2, 1].map(s => { const n = DIST.find(d => d[0] === s)[1]; return barRow(s + '★', n / 29 * 100, String(n), s >= 4 ? 'green' : s === 3 ? '' : 'red'); })))),
    h('div.d-split', { style: { marginTop: '16px', alignItems: 'start' } },
      h('div', h('span.d-label', 'Themes · pick a scope, then a theme'), segs, themes, h('span.d-label', { style: { marginTop: '14px' } }, 'Recurring complaints · threshold ≥ 2'), cl),
      cites));
  draw();
  inView(root, null);
}
