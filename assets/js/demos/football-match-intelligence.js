import { h, chip, inView } from './_kit.js';

// Synthetic Premier Division: 8 teams, 56 matches. Row: [date(20yy-), home, away, hg, ag, hShots, aShots, hSoT, aSoT, hPoss, aPoss]
const TEAMS = ['Ironbridge FC', 'Meridian United', 'Port Albans FC', 'Redcastle Athletic', 'Silverlake FC', 'Northgate Rovers', 'Coastal City FC', 'Highvale Wanderers'];
const ROWS = [["25-08-09",2,1,1,1,18,13,1,1,48,52],["25-08-10",4,3,0,0,16,8,2,0,48,52],["25-08-11",6,8,2,2,11,10,4,3,49,51],["25-08-12",4,7,4,2,17,9,6,3,60,40],["25-08-16",5,1,0,1,10,6,2,3,46,54],["25-08-17",1,5,2,1,18,5,2,1,61,39],["25-08-18",5,8,0,0,11,7,2,1,48,52],["25-08-19",3,8,0,0,9,6,1,2,53,47],["25-08-23",6,3,2,2,20,6,5,3,51,49],["25-08-24",8,3,3,0,11,9,4,1,51,49],["25-08-25",8,2,0,1,13,9,0,2,50,50],["25-08-26",6,2,2,0,18,10,5,1,47,53],["25-08-30",8,6,2,1,16,11,2,1,51,49],["25-08-31",3,2,0,2,12,14,3,4,46,54],["25-09-01",7,4,2,1,18,8,5,2,48,52],["25-09-02",7,5,3,2,17,12,5,2,49,51],["25-09-06",1,7,2,2,19,7,2,2,58,42],["25-09-07",3,7,3,0,19,4,3,2,56,44],["25-09-08",4,1,3,2,18,14,4,3,53,47],["25-09-09",3,4,0,0,18,10,3,2,52,48],["25-09-13",4,8,1,0,13,11,3,2,49,51],["25-09-14",7,1,2,1,17,15,3,2,51,49],["25-09-15",1,6,2,3,20,6,3,4,49,51],["25-09-16",5,7,1,2,14,7,2,4,55,45],["25-09-20",8,5,2,1,16,14,3,2,52,48],["25-09-21",7,3,2,1,12,8,5,3,49,51],["25-09-22",6,4,4,0,12,11,5,1,54,46],["25-09-23",3,5,2,2,12,11,3,4,56,44],["25-09-27",2,3,2,1,12,7,2,2,51,49],["25-09-28",3,1,2,1,10,9,5,2,50,50],["25-09-29",5,2,1,2,16,8,1,2,47,53],["25-09-30",1,3,1,0,21,13,1,2,55,45],["25-10-04",1,4,3,0,15,4,5,1,53,47],["25-10-05",1,2,1,0,19,5,3,1,49,51],["25-10-06",6,7,3,1,22,10,6,2,57,43],["25-10-07",6,5,2,3,15,6,3,3,50,50],["25-10-11",4,5,2,1,12,12,5,1,59,41],["25-10-12",5,6,0,1,12,6,1,2,50,50],["25-10-13",8,7,0,0,21,9,1,0,54,46],["25-10-14",2,5,3,1,19,11,5,2,55,45],["25-10-18",8,4,1,1,8,13,3,2,50,50],["25-10-19",8,1,4,1,9,15,4,2,51,49],["25-10-20",5,4,1,1,14,8,1,2,53,47],["25-10-21",4,6,3,0,16,12,5,2,52,48],["25-10-25",7,6,1,0,15,6,2,1,49,51],["25-10-26",7,2,2,2,18,13,3,4,55,45],["25-10-27",3,6,1,1,13,14,4,3,50,50],["25-10-28",6,1,0,0,15,9,1,1,50,50],["25-11-01",7,8,1,2,12,13,2,2,46,54],["25-11-02",4,2,1,2,16,13,3,3,49,51],["25-11-03",2,4,3,0,17,13,4,0,57,43],["25-11-04",2,8,3,1,19,10,6,1,58,42],["25-11-08",5,3,4,0,17,12,5,0,54,46],["25-11-09",1,8,4,0,14,11,7,0,58,42],["25-11-10",2,7,2,2,17,11,3,3,57,43],["25-11-11",2,6,2,0,13,11,5,1,53,47]];
const MATCHES = ROWS.map(r => ({ date: '20' + r[0], h: r[1], a: r[2], hg: r[3], ag: r[4], hs: r[5], as: r[6], hst: r[7], ast: r[8], hp: r[9], ap: r[10] }));
const FEATURED = [2, 1, 4, 5]; // Meridian United, Ironbridge FC, Redcastle Athletic, Silverlake FC (1-based ids)
const r1 = v => Math.round(v * 10) / 10;

function form(id, n) {
  const all = MATCHES.filter(m => m.h === id || m.a === id).sort((x, y) => (x.date < y.date ? -1 : 1));
  const win = all.slice(all.length - Math.min(n, all.length));
  const t = { w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, sh: 0, sot: 0, poss: 0, hm: 0, hg: 0, am: 0, ag: 0, seq: '', log: [] };
  win.forEach(m => {
    const home = m.h === id, gf = home ? m.hg : m.ag, ga = home ? m.ag : m.hg;
    const r = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    if (r === 'W') { t.w++; t.pts += 3; } else if (r === 'D') { t.d++; t.pts++; } else t.l++;
    t.gf += gf; t.ga += ga; t.sh += home ? m.hs : m.as; t.sot += home ? m.hst : m.ast; t.poss += home ? m.hp : m.ap;
    if (home) { t.hm++; t.hg += gf; } else { t.am++; t.ag += gf; }
    t.seq += r;
    t.log.push({ date: m.date, opp: TEAMS[(home ? m.a : m.h) - 1], home, gf, ga, r });
  });
  t.n = win.length;
  t.poss = r1(t.poss / t.n); t.acc = t.sh ? r1(100 * t.sot / t.sh) : 0;
  t.hgpm = t.hm ? r1(t.hg / t.hm) : 0; t.agpm = t.am ? r1(t.ag / t.am) : 0;
  return t;
}

// Each rule: id, plain-language condition, observed value, fired?, sentence
function rules(name, t) {
  const gap = t.hgpm - t.agpm, out = [];
  out.push({ id: 'R1', cond: 'unbeaten or winless over >= 3 matches', obs: `${t.w}W ${t.d}D ${t.l}L over ${t.n}`,
    fired: t.n >= 3 && (t.l === 0 || t.w === 0),
    text: t.l === 0 ? `${name} is unbeaten in its last ${t.n} matches (${t.w}W ${t.d}D).` : `${name} is winless in its last ${t.n} matches (${t.d}D ${t.l}L).` });
  out.push({ id: 'R2', cond: 'home vs away goals/match gap >= 0.4', obs: `${t.hgpm.toFixed(1)} home vs ${t.agpm.toFixed(1)} away, gap ${Math.abs(gap).toFixed(1)}`,
    fired: Math.abs(gap) >= 0.4,
    text: `${name} scores ${gap > 0 ? 'more at home' : 'more away from home'}: ${t.hgpm.toFixed(1)} goals/match at home vs ${t.agpm.toFixed(1)} away, in this window.` });
  out.push({ id: 'R3', cond: 'shot accuracy >= 45% (efficient) or <= 25% (volume over accuracy)', obs: `${t.acc}% of shots on target`,
    fired: t.acc >= 45 || (t.acc > 0 && t.acc <= 25),
    text: t.acc >= 45 ? `${name} is converting chances efficiently: ${t.acc.toFixed(0)}% of shots are on target.` : `${name} is generating shots but only ${t.acc.toFixed(0)}% are on target, a volume-over-accuracy pattern.` });
  out.push({ id: 'R4', cond: 'last three results all W or all L', obs: 'last three: ' + (t.seq.slice(-3) || 'n/a'),
    fired: t.seq.slice(-3) === 'WWW' || t.seq.slice(-3) === 'LLL',
    text: t.seq.slice(-3) === 'WWW' ? `${name} has won its last three consecutive matches.` : `${name} has lost its last three consecutive matches.` });
  return out;
}

const CSS = `.fmi-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.fmi-bar .d-btn[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#06121e}
.fmi-form{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 4px}
.fmi-b{width:38px;height:38px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:700 .9rem var(--mono);border:1px solid var(--line2);cursor:default}
.fmi-b.W{background:rgba(98,196,142,.16);color:var(--green);border-color:rgba(98,196,142,.5)}
.fmi-b.D{background:var(--surface2);color:var(--muted)}
.fmi-b.L{background:rgba(239,143,143,.14);color:var(--red);border-color:rgba(239,143,143,.5)}
.fmi-ins{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.fmi-ins li{border-left:3px solid var(--blue);background:var(--surface2);border-radius:8px;padding:10px 12px;font-size:.92rem}
.fmi-ins .chip{margin-top:6px;font-size:.68rem}
.fmi-rule{display:grid;grid-template-columns:2.2em 1fr auto;gap:4px 10px;align-items:start;padding:8px 0;border-bottom:1px solid var(--line);font-size:.84rem}
.fmi-rule small{display:block;color:var(--faint);font:.72rem var(--mono)}
.fmi-rule.off{opacity:.62}
.fmi-s{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:14px 0}
.fmi-s .d-stat{font-size:1.5rem}`;

export function mount(root) {
  const st = { id: 2, n: 5 };
  const teamBtns = {}, nBtns = {};
  const out = h('div');
  const mk = (cont, items, onPick, label) => h('div.fmi-bar', { role: 'group', 'aria-label': label }, items.map(([k, text]) => {
    const b = h('button.d-btn', { type: 'button', 'aria-pressed': 'false', onclick: () => { onPick(k); sync(); } }, text); cont[k] = b; return b;
  }));
  const teamBar = mk(teamBtns, [...FEATURED, ...TEAMS.map((_, i) => i + 1).filter(i => !FEATURED.includes(i))].map(i => [i, TEAMS[i - 1]]), k => { st.id = k; }, 'Team');
  const nBar = mk(nBtns, [3, 5, 10].map(n => [n, 'Last ' + n]), k => { st.n = k; }, 'Window');

  function sync() {
    Object.entries(teamBtns).forEach(([k, b]) => b.setAttribute('aria-pressed', +k === st.id));
    Object.entries(nBtns).forEach(([k, b]) => b.setAttribute('aria-pressed', +k === st.n));
    const name = TEAMS[st.id - 1], t = form(st.id, st.n), rs = rules(name, t);
    const fired = rs.filter(r => r.fired);
    const stat = (l, v, c = '') => h('div.d-card', h('span.d-label', l), h('div.d-stat' + (c ? '.' + c : ''), v));
    out.replaceChildren(
      h('div.d-card.hl', h('span.d-label', `${name}: form, oldest to newest (last ${t.n})`),
        h('div.fmi-form', t.log.map(m => h('span.fmi-b.' + m.r, { title: `${m.date} ${m.home ? 'vs' : '@'} ${m.opp} ${m.gf}-${m.ga}`, role: 'img', 'aria-label': `${m.r}: ${m.date} ${m.home ? 'home' : 'away'} ${m.opp} ${m.gf}-${m.ga}` }, m.r)))),
      h('div.fmi-s',
        stat('Points', t.pts, 'good'), stat('Record', `${t.w}-${t.d}-${t.l}`), stat('Goals', `${t.gf}-${t.ga}`), stat('Goal diff', (t.gf - t.ga >= 0 ? '+' : '−') + Math.abs(t.gf - t.ga)),
        stat('Possession', t.poss + '%'), stat('Shot accuracy', t.acc + '%'), stat('Home g/match', t.hgpm.toFixed(1)), stat('Away g/match', t.agpm.toFixed(1))),
      h('div.d-split',
        h('div.d-card', h('span.d-label', 'Generated insights (rule-based templates, no LLM)'),
          h('ul.fmi-ins', fired.length ? fired.map(r => h('li', r.text, h('div', chip('fired by ' + r.id + ': ' + r.cond, 'info')))) :
            h('li', `${name} shows no strongly one-sided pattern over its last ${t.n} matches.`, h('div', chip('fallback: no rule fired', 'info'))))),
        h('div.d-card', h('span.d-label', 'Rule check: why each sentence did or did not appear'),
          rs.map(r => h('div.fmi-rule' + (r.fired ? '' : '.off'), h('b.mono', r.id), h('span', r.cond, h('small', r.obs)), chip(r.fired ? 'FIRED' : 'no', r.fired ? 'ok' : '')))),
      ),
      h('div.d-card', { style: { marginTop: '14px' } }, h('span.d-label', 'Matches in window'),
        h('div.d-scroll', h('table.d-table', h('thead', h('tr', ['Date', 'Opponent', 'Venue', 'Score', 'Result'].map(x => h('th', x)))),
          h('tbody', t.log.slice().reverse().map(m => h('tr', h('td.num', m.date), h('td', m.opp), h('td', m.home ? 'Home' : 'Away'), h('td.num', `${m.gf}-${m.ga}`), h('td', chip(m.r, m.r === 'W' ? 'ok' : m.r === 'L' ? 'bad' : '')))))))));
  }

  root.append(h('style', CSS),
    h('p.d-note', { style: { margin: '0 0 12px' } }, 'Raw match rows in, plain-English analyst commentary out. The form window is sorted by date, aggregated, then a handful of explicit threshold rules decide which sentences are written. Synthetic data (fictional Synthetic Premier Division, 8 teams, 56 matches).'),
    h('div.d-card', h('span.d-label', 'Team'), teamBar, h('span.d-label', 'Window'), nBar), h('div', { style: { height: '14px' } }), out,
    h('p.d-note', 'Rules: points 3/1/0; shot accuracy = 100 × shots on target / shots; insight thresholds are the ones shown above. Team form only, with no head-to-head comparison.'));
  sync();
  inView(root, null);
}
