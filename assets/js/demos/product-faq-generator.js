// Product FAQ Generator — a grounded-FAQ guardrail: a FAQ exists only if its source field exists,
// and every number+unit / color claim in an answer must trace back to supplied product data.
// Deterministic template + regex port of the original (no LLM, no network).
import { h, chip, stat, inView } from './_kit.js';

const BRAND = 'ZenithWear', NAME = 'Drift 271', LABEL = BRAND + ' ' + NAME;
const FIELDS = [
  { k: 'colors', label: 'colors', val: 'Black, Grey', cat: 'Availability' },
  { k: 'features', label: 'features', val: 'Breathable mesh upper · Cushioned midsole', cat: 'Features' },
  { k: 'weight', label: 'weight (spec)', val: '250g', cat: 'Specifications' },
  { k: 'useCase', label: 'use case', val: 'long-distance running', cat: 'Usage' },
  { k: 'audience', label: 'target audience', val: 'long-distance runners', cat: 'Usage' },
];
const NUM = /\b\d+(\.\d+)?\s?(kg|g|mm|cm|m|l|ml|w|kw|mah|gb|tb|hrs?|hours?|%|inch(es)?|lbs?)\b/gi;
const COLORS = ['black', 'white', 'red', 'blue', 'navy', 'grey', 'gray', 'green', 'orange', 'olive', 'brown'];

function generate(on) {
  const f = [];
  f.push({ q: 'What category does the ' + NAME + ' belong to?', a: 'The ' + LABEL + ' is a Footwear product.', c: 'General' });
  f.push({ q: 'How much does the ' + NAME + ' cost?', a: 'The ' + LABEL + ' is priced at ₹7,499.', c: 'Pricing' });
  if (on.colors) f.push({ q: 'What color options are available for the ' + NAME + '?', a: 'The ' + LABEL + ' is available in: Black, Grey.', c: 'Availability' });
  if (on.features) f.push({ q: 'What are the key features of the ' + NAME + '?', a: 'Breathable mesh upper, Cushioned midsole.', c: 'Features' });
  if (on.weight) f.push({ q: 'What is the weight of the ' + NAME + '?', a: '250g.', c: 'Specifications' });
  if (on.useCase) f.push({ q: 'What is the ' + NAME + ' best suited for?', a: 'The ' + LABEL + ' is designed for long-distance running.', c: 'Usage' });
  if (on.audience) f.push({ q: 'Who is the ' + NAME + ' designed for?', a: 'The ' + LABEL + ' is designed for long-distance runners.', c: 'Usage' });
  return f;
}

// Same two detectors as the original: number+unit must be in features/spec text; colors must be in supplied colors.
function detect(faqs, on) {
  const truth = ((on.features ? 'breathable mesh upper cushioned midsole ' : '') + (on.weight ? '250g' : '')).toLowerCase();
  const allowed = on.colors ? ['black', 'grey'] : [];
  faqs.forEach(faq => {
    faq.errs = [];
    const re = new RegExp(NUM); let m;
    while ((m = re.exec(faq.a)) !== null) {
      const claim = m[0].trim();
      if (truth.indexOf(claim.toLowerCase()) < 0) faq.errs.push({ msg: 'Answer states "' + claim + '", which does not appear in the supplied product data.' });
    }
    const low = faq.a.toLowerCase();
    COLORS.forEach(c => {
      if (new RegExp('\\b' + c + '\\b').test(low)) {
        const canon = c === 'gray' ? 'grey' : c;
        if (allowed.indexOf(canon) < 0 && allowed.indexOf(c) < 0) faq.errs.push({ msg: 'Answer mentions color "' + c + '", which is not among the supplied colors [' + allowed.join(', ') + '].' });
      }
    });
  });
}

const CSS = `.fq-sw{display:flex;align-items:flex-start;gap:10px;padding:9px 11px;margin:0 0 8px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);cursor:pointer}
.fq-sw:hover{border-color:var(--line2)}.fq-sw input{margin-top:3px;accent-color:var(--blue);width:18px;height:18px;flex:none}
.fq-sw:focus-within{outline:2px solid var(--amber);outline-offset:2px}
.fq-sw b{display:block;font-size:.88rem}.fq-sw span{display:block;font:.78rem var(--mono);color:var(--muted);overflow-wrap:anywhere}
.fq-sw.off{opacity:.6}.fq-sw.off span{text-decoration:line-through}
.fq-sw.lock{cursor:default}.fq-item{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:11px 13px;margin-bottom:8px}
.fq-item .q{font-weight:600;font-size:.9rem}.fq-item .a{color:var(--muted);font-size:.86rem;margin-top:3px;overflow-wrap:anywhere}
.fq-item.bad{border-color:rgba(239,143,143,.6);background:rgba(239,143,143,.06)}.fq-item.bad .a{text-decoration:line-through;text-decoration-color:var(--red)}
.fq-err{font:.78rem/1.5 var(--mono);color:var(--red);margin-top:6px;overflow-wrap:anywhere}
.fq-gone{border:1px dashed var(--line2);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:.82rem;color:var(--faint)}
.fq-item.in{animation:fqin .35s ease}@keyframes fqin{from{opacity:0;transform:translateY(6px)}}`;

export function mount(root) {
  const on = { colors: true, features: true, weight: true, useCase: true, audience: true };
  const inj = { weight: false, color: false };
  const kpis = h('div.d-grid', { style: { marginBottom: '16px' } });
  const out = h('div', { 'aria-live': 'polite' });
  const gate = h('div.d-ctl');
  let fresh = null;

  const sw = FIELDS.map(f => {
    const cb = h('input', { type: 'checkbox', checked: true, onchange: () => { on[f.k] = cb.checked; fresh = f.k; draw(); } });
    const lab = h('label.fq-sw', cb, h('div', h('b', 'Source field: ' + f.label), h('span', f.val)));
    return { f, cb, lab };
  });

  function draw() {
    const base = generate(on);
    const injected = [];
    if (inj.weight) injected.push({ q: 'How much does the ' + NAME + ' weigh?', a: 'The ' + LABEL + ' weighs 300g.', c: 'Specifications', bad: true });
    if (inj.color) injected.push({ q: 'What color options are available for the ' + NAME + '?', a: 'The ' + LABEL + ' is also available in Red.', c: 'Availability', bad: true });
    const all = base.concat(injected);
    detect(all, on);
    sw.forEach(s => s.lab.classList.toggle('off', !on[s.f.k]));
    const blocked = all.filter(x => x.errs.length);
    kpis.replaceChildren(stat('FAQs published', String(all.length - blocked.length), blocked.length ? '' : 'good', '/ 7 at full data'),
      stat('Blocked by guardrail', String(blocked.length), blocked.length ? 'bad' : '', blocked.length ? 'ERROR' : 'none'));
    out.replaceChildren(
      ...all.map(x => {
        const e = x.errs;
        return h('div.fq-item' + (e.length ? '.bad' : '') + (fresh && x.c === FIELDS.find(f => f.k === fresh)?.cat && !e.length ? '.in' : ''),
          h('div.q', x.q), h('div.a', x.a), h('div', { style: { marginTop: '6px' } }, chip(x.c, e.length ? 'bad' : 'info'), ' ', e.length ? chip('ERROR · unsupported', 'bad') : chip('grounded', 'ok')),
          e.map(er => h('div.fq-err', 'ERROR: ' + er.msg)));
      }),
      FIELDS.filter(f => !on[f.k]).map(f => h('div.fq-gone', 'No “' + f.label + '” in the data, so no ' + f.cat + ' FAQ. Nothing was guessed to fill the gap.')));
    gate.replaceChildren(
      h('button.d-btn', { type: 'button', 'aria-pressed': inj.weight, onclick: () => { inj.weight = !inj.weight; draw(); } }, inj.weight ? 'Remove injected “weighs 300g”' : 'Inject unsupported claim “weighs 300g”'),
      h('button.d-btn', { type: 'button', 'aria-pressed': inj.color, onclick: () => { inj.color = !inj.color; draw(); } }, inj.color ? 'Remove injected “Red”' : 'Inject unlisted color “Red”'));
    fresh = null;
  }

  root.append(h('style', CSS),
    h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' } },
      chip('Deterministic · no LLM', 'ai'), chip('Drift 271 · ZenithWear · ₹7,499', 'info'), chip('guardrail for LLM-written FAQs')),
    kpis,
    h('div.d-split', { style: { alignItems: 'start' } },
      h('div', h('span.d-label', 'Product data · toggle a field off'),
        sw.map(s => s.lab),
        h('div.fq-sw.lock', h('div', h('b', 'Category + price'), h('span', 'Footwear · ₹7,499 — the original always emits these two'))),
        h('span.d-label', { style: { marginTop: '14px' } }, 'Simulate a bad writer'), gate,
        h('p.d-note', { style: { marginTop: '4px' } }, 'The detector checks each answer’s number+unit claims against the features and spec text, and each color word against the supplied colors. A 300g claim fails because the only supplied weight is 250g.')),
      h('div', h('span.d-label', 'Generated FAQs · live'), out)));
  draw();
  inView(root, null);
}
