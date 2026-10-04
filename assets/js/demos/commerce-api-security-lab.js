import { h, chip, reduced } from './_kit.js';

// Scripted walkthrough of the request pipeline (architecture + threat model). Not a live backend.
const G = [
  { n: 'Rate limit', cls: 'RateLimitFilter', tag: 'API4', tagName: 'Unrestricted Resource Consumption', body: 'Per-IP token bucket, first in the chain: login gets 5 requests/min, everything else 100/min.' },
  { n: 'JWT validation', cls: 'JwtAuthenticationFilter + JwtService', tag: 'API2', tagName: 'Broken Authentication', body: 'HS256, secret ≥ 32 bytes read only from the JWT_SECRET env var. An invalid or missing token leaves the request unauthenticated rather than rejecting it here, so the authorization stage can return the correct 401.' },
  { n: 'Role check', cls: 'SecurityConfig.authorizeHttpRequests', tag: 'API5', tagName: 'Broken Function Level Authorization', body: 'Public routes are explicit; everything else needs authentication; /api/admin/** needs ROLE_ADMIN, checked centrally once instead of per controller.' },
  { n: 'Ownership', cls: 'CurrentUserResolver + service-layer checks', tag: 'API1', tagName: 'Broken Object Level Authorization (BOLA)', body: 'Services never accept a user id or cart id from the caller. Whose cart / whose order is resolved from the verified JWT subject; someone else\'s order gets 403, not the data.' },
  { n: 'Audit log', cls: 'AuditLogService', tag: 'LOG', tagName: 'Insufficient Logging & Monitoring', body: 'Logins (success and failure), registrations, admin actions, access-denied events and rate-limit trips go to SLF4J plus an in-memory buffer exposed at GET /api/admin/audit-log.' },
];
const S = [
  { id: 'ok', label: 'Valid own order', req: 'GET order · Bearer <valid JWT> · order owned by caller', stop: 5, code: 200, msg: 'Order returned to its owner.',
    t: ['token available in the 100/min bucket', 'signature valid → principal = the customer', 'authenticated route, no admin role needed', 'order owner = JWT subject ✓', 'request recorded in the audit pipeline'] },
  { id: 'bola', label: "Other customer's order → 403", req: 'GET order · Bearer <valid JWT> · order owned by someone else', stop: 3, code: 403, msg: 'Blocked by the BOLA check; no order data leaves the service.',
    t: ['token available in the 100/min bucket', 'signature valid → principal = the customer', 'authenticated route, no admin role needed', 'order owner ≠ JWT subject → 403', 'access-denied event is logged'] },
  { id: 'anon', label: 'No token → 401', req: 'GET order · no Authorization header', stop: 2, code: 401, msg: 'Authorization stage returns 401 because the JWT stage left the request unauthenticated.',
    t: ['token available in the 100/min bucket', 'no token → left unauthenticated (not rejected here)', 'route needs authentication → 401', '', ''] },
  { id: 'rate', label: '6th login attempt → 429', req: 'POST login · 6th attempt from the same IP within a minute', stop: 0, code: 429, msg: 'Stopped before any credential check, which blunts brute-force attempts.',
    t: ['login bucket (5/min) is empty → 429', '', '', '', 'rate-limit trip is logged'] },
  { id: 'admin', label: 'Customer hitting /api/admin → 403', req: 'GET /api/admin/** · Bearer <valid customer JWT>', stop: 2, code: 403, msg: 'Central role rule rejects it; no controller code runs.',
    t: ['token available in the 100/min bucket', 'signature valid → principal = the customer', '/api/admin/** needs ROLE_ADMIN, principal has ROLE_CUSTOMER → 403', '', 'access-denied event is logged'] },
];
const CSS = `.sec .chip{white-space:normal}
.sec .fl{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:22px;margin:16px 0}
.sec .gt{position:relative;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:12px;color:var(--text);font:inherit;cursor:pointer;transition:border-color .3s,background .3s,opacity .3s}
.sec .gt:not(:last-child)::after{content:'→';position:absolute;right:-19px;top:50%;transform:translateY(-50%);color:var(--faint);font:700 1rem var(--mono)}
.sec .gt .k{font:.68rem var(--mono);color:var(--faint);display:block}.sec .gt b{display:block;font-size:.9rem;margin:2px 0 8px}
.sec .gt .st{display:block;font:.72rem/1.35 var(--mono);color:var(--muted);margin-top:8px}
.sec .gt.pass{border-color:var(--green);background:rgba(98,196,142,.07)}.sec .gt.pass .st{color:var(--green)}
.sec .gt.stop{border-color:var(--red);background:rgba(239,143,143,.1)}.sec .gt.stop .st{color:var(--red)}
.sec .gt.sk{opacity:.75;border-style:dashed}.sec .gt.sk b{color:var(--muted)}.sec .gt[aria-pressed=true]{outline:2px solid var(--blue);outline-offset:2px}
.sec .sc{display:flex;flex-wrap:wrap;gap:8px}.sec .sc .d-btn[aria-pressed=true]{border-color:var(--blue);color:var(--blue-lt);background:#14202e}
.sec .res{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.sec .res .d-stat{min-width:3.2ch}
@media(max-width:860px){.sec .fl{grid-template-columns:1fr;gap:20px}.sec .gt:not(:last-child)::after{content:'↓';right:auto;left:50%;top:auto;bottom:-20px;transform:translateX(-50%)}}`;

export function mount(root) {
  let cur = S[1], run = 0, sel = 3, shown = 5;
  const el = h('div.sec', h('style', CSS)); root.append(el);
  const sc = h('div.sc', { role: 'group', 'aria-label': 'Request scenarios' }), flow = h('div.fl'), res = h('div.d-card', { style: { marginBottom: '12px' } }), det = h('div.d-card.hl');
  el.append(h('div.d-ctl', chip('Scripted walkthrough, not a live backend', 'warn'), chip('Spring Security · OWASP API Top 10', 'info')),
    h('span.d-label', 'Send a request'), sc, flow, res, det,
    h('p.d-note', 'Each stage is real code in the repo; the claim that a customer cannot read another customer\'s order is covered by a MockMvc integration test there. The runs above are scripted illustrations of that logic.'));

  const gates = G.map((g, i) => {
    const b = h('button.gt', { type: 'button', 'aria-pressed': 'false', onclick: () => { sel = i; paint(); } });
    flow.append(b); return b;
  });
  function paint() {
    sc.replaceChildren(...S.map(s => h('button.d-btn', { type: 'button', 'aria-pressed': String(s === cur), onclick: () => play(s) }, s.label)));
    gates.forEach((b, i) => {
      const g = G[i], state = i >= shown ? 'idle' : i < cur.stop ? 'pass' : i === cur.stop ? 'stop' : 'sk';
      const logGate = i === 4 && cur.t[4];
      const cls = i >= shown ? '' : state === 'sk' && logGate ? 'pass' : state;
      b.className = 'gt' + (cls ? ' ' + cls : ''); b.setAttribute('aria-pressed', String(i === sel));
      const txt = i >= shown ? 'waiting' : cls === 'pass' ? '✓ ' + (cur.t[i] || 'pass') : cls === 'stop' ? '✗ ' + cur.code + ' · ' + cur.t[i] : cur.t[i] && i === 4 ? '' : 'not reached';
      b.replaceChildren(h('span.k', '0' + (i + 1)), h('b', g.n), chip(g.tag, i === cur.stop && shown > i ? 'bad' : 'info'), h('span.st', txt));
    });
    const done = shown >= 5, ok = cur.code === 200;
    res.replaceChildren(h('div.res', h('div.d-stat' + (ok ? '.good' : '.bad'), done ? String(cur.code) : '…'), h('div', h('div.mono', { style: { fontSize: '.8rem', color: 'var(--muted)' } }, cur.req), h('div', { style: { fontSize: '.92rem', marginTop: '4px' } }, done ? cur.msg : 'Request in flight…'))));
    const g = G[sel];
    det.replaceChildren(h('span.d-label', 'Gate ' + (sel + 1) + ' · ' + g.cls), h('p', { style: { margin: '0 0 10px', fontSize: '.9rem' } }, g.body), chip('OWASP ' + (g.tag === 'LOG' ? '' : g.tag + ' · ') + g.tagName, 'ai'));
  }
  function play(s) {
    cur = s; run++; const my = run; sel = s.stop < 5 ? s.stop : 3;
    if (reduced) { shown = 5; paint(); return; }
    shown = 0; paint();
    const tick = () => { if (my !== run) return; shown++; paint(); if (shown < 5) setTimeout(tick, 380); };
    setTimeout(tick, 250);
  }
  paint();
}
