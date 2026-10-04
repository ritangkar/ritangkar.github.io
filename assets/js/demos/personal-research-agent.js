import { h, stepper, chip, inView } from './_kit.js';

// RECORDED run of the pipeline over a small bundled SYNTHETIC corpus. Template synthesizer; no live LLM, no web.
// DOCS = [title, source, tier, year]; EV rows = [id, doc, relevance, credibility, recency, overall]
const DOCS = [["Four-day pilots report modest productivity gains across pilot cohorts","Journal of Workplace Studies (synthetic)","A",2025],["Retention improves modestly at firms offering a four-day option","Journal of Workplace Studies (synthetic)","A",2025],["Scheduling complexity remains the top implementation barrier","Northfield Business Review (fictional)","B",2024],["Employee-reported burnout scores fall in shortened-week trial","Meridian Labor Institute (fictional think tank)","A",2024],["Client-facing teams report mixed results on responsiveness","Northfield Business Review (fictional)","B",2023]];
const EV = {"S1":[["S1-E1",0,0.67,1.0,0.83,0.8],["S1-E3",1,0.67,1.0,0.83,0.8],["S1-E2",2,0.67,0.75,0.67,0.69],["S1-E4",3,0.5,1.0,0.67,0.68]],"S2":[["S2-E1",0,0.71,1.0,0.83,0.82],["S2-E4",1,0.57,1.0,0.83,0.75],["S2-E2",2,0.57,0.75,0.67,0.64],["S2-E3",4,0.57,0.75,0.5,0.61]],"S3":[["S3-E1",0,0.62,1.0,0.83,0.78],["S3-E4",1,0.5,1.0,0.83,0.72],["S3-E2",2,0.5,0.75,0.67,0.61],["S3-E3",4,0.5,0.75,0.5,0.57]],"S4":[["S4-E1",0,0.57,1.0,0.83,0.75],["S4-E3",1,0.57,1.0,0.83,0.75],["S4-E4",3,0.43,1.0,0.67,0.65],["S4-E2",2,0.57,0.75,0.67,0.64]]};
const ANS = {"S1":["What is the current state of four-day work week?","Based on 3 sources: Across a multi-employer pilot cohort, output per employee was reported as broadly stable to slightly improved after moving to a four-day week, with participating firms citing fewer low-value meetings as a contributing factor. (Journal of Workplace Studies (synthetic), 2025) Firms offering a four-day-week option as part of a flexible-work package reported a small but consistent improvement in voluntary turnover compared with peer firms without the option, controlling for compensation. (Journal of Workplace Studies (synthetic), 2025) Operations leaders surveyed identified shift-coverage and client-availability scheduling as the most commonly cited obstacle to adopting a four-day week, particularly in customer-facing and healthcare-adjacent roles. (Northfield Business Review (fictional), 2024)",["S1-E1","S1-E3","S1-E2"]],"S2":["What benefits does the evidence report for four-day work week?","Based on 3 sources: Across a multi-employer pilot cohort, output per employee was reported as broadly stable to slightly improved after moving to a four-day week, with participating firms citing fewer low-value meetings as a contributing factor. (Journal of Workplace Studies (synthetic), 2025) Firms offering a four-day-week option as part of a flexible-work package reported a small but consistent improvement in voluntary turnover compared with peer firms without the option, controlling for compensation. (Journal of Workplace Studies (synthetic), 2025) Operations leaders surveyed identified shift-coverage and client-availability scheduling as the most commonly cited obstacle to adopting a four-day week, particularly in customer-facing and healthcare-adjacent roles. (Northfield Business Review (fictional), 2024)",["S2-E1","S2-E4","S2-E2"]],"S3":["What risks or challenges does the evidence report for four-day work week?","Based on 3 sources: Across a multi-employer pilot cohort, output per employee was reported as broadly stable to slightly improved after moving to a four-day week, with participating firms citing fewer low-value meetings as a contributing factor. (Journal of Workplace Studies (synthetic), 2025) Firms offering a four-day-week option as part of a flexible-work package reported a small but consistent improvement in voluntary turnover compared with peer firms without the option, controlling for compensation. (Journal of Workplace Studies (synthetic), 2025) Operations leaders surveyed identified shift-coverage and client-availability scheduling as the most commonly cited obstacle to adopting a four-day week, particularly in customer-facing and healthcare-adjacent roles. (Northfield Business Review (fictional), 2024)",["S3-E1","S3-E4","S3-E2"]],"S4":["What does the evidence suggest about the trajectory of four-day work week?","Based on 3 sources: Across a multi-employer pilot cohort, output per employee was reported as broadly stable to slightly improved after moving to a four-day week, with participating firms citing fewer low-value meetings as a contributing factor. (Journal of Workplace Studies (synthetic), 2025) Firms offering a four-day-week option as part of a flexible-work package reported a small but consistent improvement in voluntary turnover compared with peer firms without the option, controlling for compensation. (Journal of Workplace Studies (synthetic), 2025) Self-reported burnout and exhaustion scores declined for employees on a compressed four-day schedule compared with a matched five-day control group over a six-month trial period. (Meridian Labor Institute (fictional think tank), 2024)",["S4-E1","S4-E3","S4-E4"]]};

const QUESTION = 'What are the effects of a four-day work week?';
const TIER = { A: 'ok', B: 'info' };
const STEPS = [
  { k: '01', title: 'Plan', sub: 'topic → 4 sub-questions' },
  { k: '02', title: 'Tool call', sub: 'mock search × 4' },
  { k: '03', title: 'Evaluate', sub: '0.5·rel + 0.3·cred + 0.2·recency', cls: 'ai' },
  { k: '04', title: 'Synthesize', sub: 'cite, score, caveat', cls: 'ai' },
];
const CSS = `.pra .chip{white-space:normal}
.pra .tk{position:relative;height:12px;background:var(--surface2);border-radius:999px}
.pra .tk i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--amber)}
.pra .tk u{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--red);text-decoration:none}
.pra .er{display:grid;grid-template-columns:minmax(0,1fr) minmax(90px,38%) auto;gap:6px 12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);font-size:.84rem}
.pra .er small{grid-column:1/-1;color:var(--faint);font:.72rem var(--mono)}
@media(max-width:520px){.pra .er{grid-template-columns:1fr auto}.pra .er .tk{grid-column:1/-1}}`;

export function mount(root) {
  let sec = 'S3';
  const el = h('div.pra', h('style', CSS)); root.append(el);
  const stage = h('div');
  el.append(h('div.d-ctl', chip('Recorded run', 'ai'), chip('Synthetic corpus', 'info'), chip('Template synthesizer · llmSynthesisUsed: false', 'warn')));
  const st = stepper(el, STEPS, i => draw(i));
  el.append(stage);

  const secBtns = (render) => h('div.d-ctl', { role: 'group', 'aria-label': 'Sub-question' }, Object.keys(ANS).map(k =>
    h('button.d-btn', { type: 'button', 'aria-pressed': String(k === sec), style: k === sec ? { borderColor: 'var(--amber)', color: 'var(--amber-lt)' } : null, onclick: () => { sec = k; render(); } }, k)));

  function draw(i) {
    stage.replaceChildren();
    const card = h('div.d-card' + (i >= 2 ? '.ai' : '')); stage.append(card); card.classList.add('is-in');
    if (i === 0) {
      card.append(h('span.d-label', 'Question'), h('p', { style: { margin: '0 0 6px', fontSize: '1.02rem' } }, QUESTION),
        h('span.d-label', 'Extracted topic'), h('div', h('span.tok.amber', 'four-day work week')), h('span.d-label', { style: { marginTop: '14px' } }, 'Decomposed plan'),
        ...Object.entries(ANS).map(([k, v]) => h('div', { style: { display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '.88rem' } }, h('b.mono', { style: { color: 'var(--blue-lt)' } }, k), v[0])));
    } else if (i === 1) {
      card.append(h('span.d-label', 'Tool: MockSearchTool · keyword matchScore over the bundled corpus'),
        ...Object.keys(ANS).map(k => h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '.86rem' } }, h('span', h('b.mono', k + ' '), ' search call'), chip('4 retrieved · cache miss'))),
        h('div.d-grid', { style: { marginTop: '14px' } }, [['4', 'tool calls'], ['16', 'evidence retrieved'], ['0 / 4', 'cache hits / misses']].map(([v, l]) => h('div.d-card', h('div.d-stat', v), h('span.d-label', { style: { margin: '4px 0 0' } }, l)))),
        h('p.d-note', 'Retrieval here is simple keyword matching, not a web search. The 16 hits are five distinct synthetic documents reused across the four sub-questions.'));
    } else if (i === 2) {
      const draw3 = () => {
        card.replaceChildren(secBtns(draw3), h('span.d-label', 'Evidence score · gate at 0.35 (red line)'),
          ...EV[sec].map(([id, d, rel, cred, rec, ov], j) => h('div.er',
            h('span', h('b.mono', id + ' '), DOCS[d][0]),
            h('div.tk', { role: 'img', 'aria-label': 'overall ' + ov }, h('i', { style: { width: (ov * 100) + '%' } }), h('u', { style: { left: '35%' } })),
            h('span', chip('tier ' + DOCS[d][2], TIER[DOCS[d][2]]), ' ', h('b.mono', ov.toFixed(2))),
            h('small', 'rel ' + rel + '×.5 + cred ' + cred + '×.3 + recency ' + rec + '×.2 · ' + DOCS[d][3] + ' · ' + (j < 3 ? 'kept (top 3)' : 'passed gate, over the 3-per-section cap')))),
          h('p.d-note', 'Source tier A = 1.0, B = 0.75. In this recorded run every item scored above 0.57, so the 0.35 gate rejected none; the cap of 3 per section kept 12 of 16. Citations are re-validated against the accepted ids before they enter the report.'));
      };
      draw3();
    } else {
      const draw4 = () => {
        const a = ANS[sec], cited = a[2];
        card.replaceChildren(secBtns(draw4), h('span.d-label', sec + ' · ' + a[0]),
          h('p', { style: { margin: '0 0 10px', fontSize: '.88rem', color: 'var(--muted)' } }, a[1]), h('div', cited.map(c => chip(c, 'ai')), ' ', h('span.d-note', 'citations re-validated')));
      };
      draw4();
      stage.append(h('div.d-grid', { style: { marginTop: '14px' } }, [['4', 'tool calls'], ['16', 'retrieved'], ['12', 'accepted'], ['~968', 'est. tokens'], ['0.73', 'confidence']].map(([v, l]) => h('div.d-card', h('div.d-stat.amber', v), h('span.d-label', { style: { margin: '4px 0 0' } }, l)))),
        h('div.d-card.ai', { style: { marginTop: '14px' } }, h('span.d-label', 'Honest caveat'), h('p', { style: { margin: 0, fontSize: '.88rem' } }, 'Demo mode: evidence comes only from a small bundled synthetic corpus, not the live web, and the recorded run used a template synthesizer (llmSynthesisUsed: false). The pipeline has a pluggable LLM client behind these guardrails, but no LLM was called for the numbers on this page.')));
    }
  }
  st.go(2);
  inView(el, null);
}
