// Tiny DOM helpers shared by all demos. No dependencies.
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** h('div.d-card.hl', {id:'x'}, 'text', childNode, ...) — children may be strings, nodes, arrays or null. */
export function h(sel, attrs, ...kids) {
  const [tag, ...cls] = sel.split('.');
  const el = document.createElement(tag || 'div');
  if (cls.length) el.className = cls.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || (v === false && !k.startsWith('aria-'))) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true && !k.startsWith('aria-') ? '' : String(v));
  }
  (function add(list) {
    for (const k of list) {
      if (k == null || k === false) continue;
      if (Array.isArray(k)) add(k);
      else el.append(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  })(kids);
  return el;
}

/** Run cb once when el scrolls into view (immediately if reduced motion / no IO). */
export function inView(el, cb) {
  if (reduced || !('IntersectionObserver' in window)) { el.classList.add('is-in'); cb && cb(); return; }
  const io = new IntersectionObserver(es => {
    if (es[0].isIntersecting) { io.disconnect(); el.classList.add('is-in'); cb && cb(); }
  }, { threshold: .2 });
  io.observe(el);
}

/** Accessible tablist. tabs: [{id,label,render:(panel)=>void}]. Returns {select(id)}. */
export function tabs(root, items, initial) {
  const bar = h('div.d-tabs', { role: 'tablist' });
  const panel = h('div', { role: 'tabpanel', tabindex: '0' });
  const btns = {};
  const select = id => {
    for (const [k, b] of Object.entries(btns)) { b.setAttribute('aria-selected', k === id); b.tabIndex = k === id ? 0 : -1; }
    const it = items.find(i => i.id === id);
    panel.replaceChildren(); panel.setAttribute('aria-labelledby', 'tab-' + id);
    it.render(panel);
    inView(panel, null);
  };
  items.forEach((it, i) => {
    const b = h('button.d-tab', { role: 'tab', id: 'tab-' + it.id, type: 'button', onclick: () => select(it.id),
      onkeydown: e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        const n = items[(i + d + items.length) % items.length].id; select(n); btns[n].focus();
      } }, it.label);
    btns[it.id] = b; bar.append(b);
  });
  root.append(bar, panel);
  select(initial || items[0].id);
  return { select };
}

/** Pipeline stepper. steps:[{k,title,sub,cls?}]. onStep(i) fires on click/Next/auto. Returns {go(i)}. */
export function stepper(root, steps, onStep, { auto = false } = {}) {
  const wrap = h('div.d-flow', { role: 'group', 'aria-label': 'Pipeline stages' });
  const nodes = steps.map((s, i) => h('button.d-step' + (s.cls ? '.' + s.cls : ''), { type: 'button', onclick: () => go(i) },
    h('span.k', s.k || String(i + 1).padStart(2, '0')), h('b', s.title), s.sub ? h('span', s.sub) : null));
  wrap.append(...nodes); root.append(wrap);
  let cur = -1;
  function go(i) {
    cur = i;
    nodes.forEach((n, j) => { n.classList.toggle('is-active', j === i); n.classList.toggle('is-done', j < i); n.setAttribute('aria-current', j === i ? 'step' : 'false'); });
    onStep && onStep(i);
  }
  go(0);
  const ctl = h('div.d-ctl',
    h('button.d-btn', { type: 'button', onclick: () => go(Math.max(0, cur - 1)) }, '← Back'),
    h('button.d-btn.pri', { type: 'button', onclick: () => go(Math.min(steps.length - 1, cur + 1)) }, 'Next stage →'));
  root.append(ctl);
  return { go, get index() { return cur; } };
}

/** A labelled bar row. pct 0-100. variant: '', 'amber','green','red','dim'. */
export function barRow(label, pct, valueText, variant = '') {
  return h('div.d-row', h('span', label), h('div.bar' + (variant ? '.' + variant : ''), { style: { '--w': Math.max(0, Math.min(100, pct)) + '%' } }, h('i')), h('span.n', valueText));
}

export const chip = (text, kind = '') => h('span.chip' + (kind ? '.' + kind : ''), text);
export const stat = (label, value, cls = '', small) => h('div.d-card', h('span.d-label', label), h('div.d-stat' + (cls ? '.' + cls : ''), value, small ? h('small', small) : null));
export const inr = n => '₹' + Number(n).toLocaleString('en-IN');
