// SAP Commerce MCP — a SIMULATED walkthrough of asking a local SAP Commerce instance questions through an MCP client.
// Everything here is hard-coded sample data. No network calls, no AI/LLM, no HAC, no MCP server, no credentials.
// Tool names, argument shapes and result shapes mirror github.com/ritangkar/sap-commerce-mcp
// (src/core/tools/definitions.ts): flexible_search, type_info, config_get, logs_tail, cronjob.
import { h, chip, stat, inView } from './_kit.js';

const CSS = `.mc-q{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}
.mc-q .d-btn[aria-pressed=true]{border-color:var(--blue);background:#14202e}
.mc-form{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.mc-form input{flex:1 1 220px;min-width:0;background:var(--bg);color:var(--text);border:1px solid var(--line2);border-radius:8px;padding:10px 12px;font:.9rem var(--sans)}
.mc-bubble{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:12px 14px;margin-bottom:12px;overflow-wrap:anywhere}
.mc-bubble.me{border-color:var(--blue)}.mc-bubble.bad{border-color:rgba(239,143,143,.6);background:rgba(239,143,143,.06)}
.mc-steps{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:6px}
.mc-steps li{font:.8rem var(--mono);color:var(--muted);padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.mc-steps li.on{color:var(--text);border-color:var(--line2)}.mc-steps li:not(.on){opacity:.35}
.mc-sim{font:.74rem var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--amber-lt);margin:0 0 8px}
.mc-flow{font:.8rem/1.7 var(--mono);color:var(--muted);margin:0;white-space:pre-wrap;overflow-wrap:anywhere}`;

// ---- Sample data (synthetic; not from any real instance) ----
const TOOLS = [
  ['flexible_search', 'Validated read-only FlexibleSearch SELECT (max 200 rows), or translate to SQL'],
  ['type_info', 'Super type, abstract flag, attributes and sub types of a type'],
  ['config_get', 'One configuration property, or those matching a key filter; secret-like values masked'],
  ['logs_tail', 'Last lines of the configured console log, plain-text filter'],
  ['cronjob', 'List CronJobs or read one status; cannot trigger or modify'],
];

const SCENARIOS = [
  {
    id: 'products', label: 'Show me 5 products',
    match: /\b(products?|items?)\b.*\b(show|list|first|five|5|sample)\b|\b(show|list)\b.*\bproducts?\b/i,
    tool: 'flexible_search',
    args: { query: 'SELECT {pk},{code},{name[en]} FROM {Product}', maxCount: 5 },
    answer: 'Here are 5 products from the sample catalog. The query is a single SELECT, so the validator accepts it; the row cap comes from maxCount.',
    result: {
      columns: ['pk', 'code', 'name'],
      rows: [
        { pk: '8796093054977', code: 'TRL-100', name: 'Trail Runner 100' },
        { pk: '8796093087745', code: 'TRL-200', name: 'Trail Runner 200' },
        { pk: '8796093120513', code: 'JKT-310', name: 'Rain Shell Jacket' },
        { pk: '8796093153281', code: 'BAG-045', name: 'Day Pack 20L' },
        { pk: '8796093186049', code: 'CAP-007', name: 'Sun Cap' },
      ],
      rowCount: 5, truncated: true,
    },
    table: true,
  },
  {
    id: 'count', label: 'How many products are there?',
    match: /\b(how many|count|number of|total)\b.*\bproducts?\b|\bproducts?\b.*\b(count|total)\b/i,
    tool: 'flexible_search',
    args: { query: 'SELECT COUNT({pk}) FROM {Product}', maxCount: 200 },
    answer: 'The sample catalog has 1,248 products. COUNT is one of the read-only functions the validator allows.',
    result: { columns: ['COUNT({pk})'], rows: [{ 'COUNT({pk})': '1248' }], rowCount: 1, truncated: false },
    table: true,
  },
  {
    id: 'type', label: 'What attributes does the Product type have?',
    match: /\b(attributes?|fields?|type|model)\b.*\bproduct\b|\bproduct\b.*\b(attributes?|fields?|type)\b/i,
    tool: 'type_info', args: { type: 'Product', includeInherited: false },
    answer: 'Product extends GenericItem and is not abstract. Three of its declared attributes are shown below (sample, abbreviated). type_info is built from read-only FlexibleSearch queries on the type system.',
    result: {
      code: 'Product', superType: 'GenericItem', abstract: false,
      attributes: [
        { qualifier: 'code', type: 'java.lang.String', localized: false, optional: false, unique: true, partOf: false, declaredIn: 'Product' },
        { qualifier: 'name', type: 'localized:java.lang.String', localized: true, optional: true, unique: false, partOf: false, declaredIn: 'Product' },
        { qualifier: 'catalogVersion', type: 'CatalogVersion', localized: false, optional: false, unique: true, partOf: false, declaredIn: 'Product' },
      ],
      subtypes: ['VariantProduct', 'ApparelProduct'],
      notes: ['Deployment table / persistence info is not exposed (requires scripting access, which this tool does not use).'],
    },
  },
  {
    id: 'cron', label: 'List the most recent CronJobs',
    match: /\b(cron ?jobs?|jobs?|scheduled)\b/i,
    tool: 'cronjob', args: { action: 'list' },
    answer: 'Three recent CronJobs from the sample instance. The cronjob tool can only list or read status; it cannot start, abort or modify a job.',
    result: {
      cronjobs: [
        { code: 'sampleSolrIndexerCronJob', status: 'FINISHED', result: 'SUCCESS', startTime: '2026-01-14 02:00:03', endTime: '2026-01-14 02:04:41' },
        { code: 'sampleCartRemovalCronJob', status: 'FINISHED', result: 'SUCCESS', startTime: '2026-01-14 01:00:00', endTime: '2026-01-14 01:00:12' },
        { code: 'sampleCatalogSyncCronJob', status: 'FINISHED', result: 'ERROR', startTime: '2026-01-13 23:30:00', endTime: '2026-01-13 23:31:09' },
      ],
      truncated: false,
    },
    table: 'cronjobs',
  },
  {
    id: 'config', label: 'What is the value of build.version?',
    match: /\b(config|configuration|propert(y|ies)|build\.version|version)\b/i,
    tool: 'config_get', args: { key: 'build.version' },
    answer: 'config_get reads HAC’s configuration page with a GET request. The version value below is made up for the demo.',
    result: { key: 'build.version', value: '2211.99.0' },
  },
  {
    id: 'secret', label: 'Show me db.password',
    match: /\b(password|passwd|secret|token|credential)s?\b/i,
    tool: 'config_get', args: { key: 'db.password' },
    answer: 'Secret-like keys are masked before the value leaves the server, so the client and the model never see it.',
    result: { key: 'db.password', value: '****' },
  },
  {
    id: 'logs', label: 'Any errors in the log?',
    match: /\b(logs?|errors?|exceptions?|stack ?trace)\b/i,
    tool: 'logs_tail', args: { lines: 2, grep: 'ERROR' },
    answer: 'logs_tail reads the local console log file configured by the developer and returns the matching lines, with secret-like values masked on a best-effort basis.',
    result: {
      lines: [
        '2026-01-13 23:31:08,412 ERROR [CatalogSyncJob] sampleCatalogSyncCronJob: 3 items failed to synchronize',
        '2026-01-13 23:31:09,020 ERROR [CronJobExecutor] Job sampleCatalogSyncCronJob finished with result ERROR',
      ],
      matched: 2, filter: 'ERROR',
    },
  },
  {
    id: 'delete', label: 'Delete all products',
    match: /\b(delete|remove|drop|truncate|update|insert|import|create|modify|change|run|start|trigger|abort|groovy|script)\b/i,
    tool: null, args: { query: 'DELETE FROM {Product}' },
    refused: true,
    answer: 'Nothing was changed. The tool allow-list has no write tool. Even if a client sent this text as a FlexibleSearch query, the validator accepts only a single SELECT and rejects mutation keywords before anything is sent to HAC.',
    result: { error: 'Query rejected by the read-only FlexibleSearch validator (sample message)' },
  },
];

const STEPS = ['Question received', 'Client model picks a tool', 'Server validates arguments', 'HAC call (simulated)', 'Result masked and returned'];

const json = o => JSON.stringify(o, null, 2);

function pick(text) {
  const t = text.trim();
  if (!t) return null;
  // Order matters: write attempts and secrets first, then specific questions.
  const order = ['delete', 'secret', 'count', 'type', 'cron', 'logs', 'config', 'products'];
  for (const id of order) { const s = SCENARIOS.find(x => x.id === id); if (s.match.test(t)) return s; }
  return null;
}

function resultTable(rows, cols) {
  return h('div.d-scroll', h('table.d-table', h('thead', h('tr', cols.map(c => h('th', c)))),
    h('tbody', rows.map(r => h('tr', cols.map(c => h('td', r[c] == null ? '—' : String(r[c]))))))));
}

export function mount(root) {
  const out = h('div', { 'aria-live': 'polite' });
  const btns = {};
  const input = h('input', { type: 'text', id: 'mc-in', maxlength: '120', autocomplete: 'off', 'aria-label': 'Ask a question (sample responses only)', placeholder: 'Ask a question, e.g. “how many products are there?”' });
  let timer = null;

  function show(question, sc) {
    clearTimeout(timer);
    Object.entries(btns).forEach(([id, b]) => b.setAttribute('aria-pressed', String(sc && sc.id === id)));
    const me = h('div.mc-bubble.me', h('span.d-label', 'You asked'), question);
    if (!sc) {
      out.replaceChildren(me, h('div.mc-bubble.bad', h('span.d-label', 'No sample response'),
        h('p', { style: { margin: '0 0 8px' } }, 'This portfolio demo does not interpret free text and has no AI behind it. It only recognises the sample scenarios above: products, product count, the Product type, CronJobs, a config property, a masked secret, log errors, and a blocked write.'),
        h('p.d-note', { style: { margin: 0 } }, 'With a real MCP client your own model would translate the question into one of the five tools. Try one of the suggested questions.')));
      return;
    }
    const steps = h('ul.mc-steps', STEPS.map(s => h('li', s)));
    const body = h('div');
    out.replaceChildren(me, h('p.mc-sim', 'Simulated · sample data · nothing was sent anywhere'), steps, body);
    const render = () => {
      const call = sc.tool ? { tool: sc.tool, arguments: sc.args } : { tool: '(none) — client attempted a write', arguments: sc.args };
      body.append(
        h('div.mc-bubble', h('span.d-label', 'What the client would send to the MCP server'), h('pre.d-code', json(call))),
        sc.refused ? h('div.mc-bubble.bad', h('span.d-label', 'Refused'), sc.answer, h('pre.d-code', { style: { marginTop: '10px' } }, json(sc.result)))
          : h('div.mc-bubble', h('span.d-label', 'Sample result (structured)'),
            sc.table === true ? resultTable(sc.result.rows, sc.result.columns) : sc.table === 'cronjobs' ? resultTable(sc.result.cronjobs, ['code', 'status', 'result', 'startTime', 'endTime']) : null,
            sc.table ? null : h('pre.d-code', json(sc.result)),
            h('details', { style: { marginTop: '10px' } }, h('summary', 'Show raw JSON'), h('pre.d-code', json(sc.result)))),
        sc.refused ? null : h('div.mc-bubble', h('span.d-label', 'Answer the client model might give'), sc.answer, ' ', chip('sample data', 'warn')));
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lis = [...steps.children];
    const stopAt = sc.refused ? 3 : STEPS.length;
    let i = 0;
    const tick = () => {
      lis[i].classList.add('on'); i++;
      if (i < stopAt && !reduce) timer = setTimeout(tick, 280); else { if (reduce) while (i < stopAt) lis[i++].classList.add('on'); render(); }
    };
    tick();
  }

  const ask = text => show(text, pick(text));
  SCENARIOS.forEach(s => { btns[s.id] = h('button.d-btn', { type: 'button', 'aria-pressed': 'false', onclick: () => { input.value = ''; show(s.label, s); } }, s.label); });

  root.append(h('style', CSS),
    h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' } },
      chip('Simulation · hard-coded sample data', 'warn'), chip('Read-only tools', 'ok'), chip('No network · no AI')),
    h('div.mc-bubble.bad', h('b', 'This demo is not connected to anything. '),
      'It does not contact SAP Commerce, HAC, Claude or any MCP server, makes no network requests and runs no queries. Every result is invented sample data, and it will not ask for or store any credentials: please do not type any.'),
    h('span.d-label', 'Suggested questions'),
    h('div.mc-q', SCENARIOS.map(s => btns[s.id])),
    h('form.mc-form', { onsubmit: e => { e.preventDefault(); if (input.value.trim()) ask(input.value); } },
      input, h('button.d-btn.pri', { type: 'submit' }, 'Ask (sample)')),
    h('p.d-note', { style: { margin: '0 0 16px' } }, 'Free text is matched to a sample scenario by simple keywords; anything else gets an honest “no sample response”.'),
    out,
    h('div.d-split', { style: { marginTop: '22px', alignItems: 'start' } },
      h('div.d-card', h('span.d-label', 'The five read-only tools (complete allow-list)'),
        h('dl.d-kv', TOOLS.flatMap(([n, d]) => [h('dt', n), h('dd', { style: { textAlign: 'left', fontFamily: 'var(--sans)', fontSize: '.8rem' } }, d)]))),
      h('div.d-card', h('span.d-label', 'How a real client connects'),
        h('pre.mc-flow', 'MCP client (Claude Code, Copilot in VS Code, …)\n  │  starts: node dist/mcp/main.js   (stdio, local)\n  ▼\nMCP server ── allow-listed tools + validator\n  │  HTTP(S) to HAC on loopback/private host\n  ▼\nYour local SAP Commerce (HAC)\n\nHAC_URL, HAC_USER, HAC_PASS come from your own\n.env or the client config on your machine.'),
        h('p.d-note', 'The server needs no AI key; the client brings its own model. Local development instances only.'))));
  inView(root, null);
}
