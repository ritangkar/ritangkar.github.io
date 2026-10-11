/* ============================================================================
   world.js — "The Commerce Stack": one continuous, real-time WebGL flight.
   ----------------------------------------------------------------------------
   Design lineage
   - oso95/scroll-world (MIT): the idea of ONE connected flight through a chain of
     scenes, where scroll only drives time, each scene gets a dwell, and scenes are
     joined without cuts. scroll-world pre-renders that flight as AI video (paid
     generation); here the same chain is rendered live from procedural geometry, so
     there are no assets to load and the camera stays velocity-responsive.
   - Lenis supplies the smoothed scroll position and its velocity (see motion.js).
   - Raw WebGL1, no dependencies: lines + points in three vertex buffers.

   Scenes (zone index = camera stop; D units apart on -z):
     0 catalog field/tunnel · 1 career ascent · 2 architecture layers
     3 AI neural mesh + guardrail cage · 4 lab cubes · 5 destination sphere

   Public API:  World.set(zone, velocity)   zone: float 0..5, velocity: -1.5..1.5
   ========================================================================== */
(() => {
  const canvas = document.getElementById('world');
  if (!canvas) return;
  const root = document.documentElement;
  const fail = () => { root.classList.add('no-3d'); canvas.hidden = true; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
  // Inner pages (lab, projects): one calm, static frame — no travel, no animation, no per-frame cost.
  const still = reduce || !document.querySelector('[data-scenes]');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' });
  if (!gl) return fail();

  /* ---------- geometry ---------- */
  const D = 64, Q = coarse || innerWidth < 760 ? 0.4 : 1;
  let seed = 20260711;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = (a, b) => a + (b - a) * rnd();
  const LN = [], PT = [], ST = [];
  // vertex = pos(3) meta(zone,hue,size)(3) end(3) anim(speed,phase)(2)
  const V = (a, x, y, z, zone, hue, size, ex, ey, ez, sp, ph) => a.push(x, y, z, zone, hue, size, ex, ey, ez, sp, ph);
  const ln = (ax, ay, az, bx, by, bz, zone, hue) => { V(LN, ax, ay, az, zone, hue, 0, ax, ay, az, 0, 0); V(LN, bx, by, bz, zone, hue, 0, bx, by, bz, 0, 0); };
  const dot = (x, y, z, zone, hue, size) => V(PT, x, y, z, zone, hue, size, x, y, z, 0, 0);
  const pulse = (ax, ay, az, bx, by, bz, zone, hue, size, sp, ph) => V(PT, ax, ay, az, zone, hue, size, bx, by, bz, sp, ph);
  const box = (cx, cy, cz, w, h, d, zone, hue) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(([x, y], i, a) => {
      const [nx, ny] = a[(i + 1) % 4];
      ln(x, y, z0, nx, ny, z0, zone, hue); ln(x, y, z1, nx, ny, z1, zone, hue); ln(x, y, z0, x, y, z1, zone, hue);
    });
  };
  const ring = (cx, cy, cz, r, seg, plane, zone, hue) => {
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * 6.2832, b = ((i + 1) / seg) * 6.2832, c1 = Math.cos(a) * r, s1 = Math.sin(a) * r, c2 = Math.cos(b) * r, s2 = Math.sin(b) * r;
      if (plane === 'xy') ln(cx + c1, cy + s1, cz, cx + c2, cy + s2, cz, zone, hue);
      else if (plane === 'xz') ln(cx + c1, cy, cz + s1, cx + c2, cy, cz + s2, zone, hue);
      else ln(cx, cy + c1, cz + s1, cx, cy + c2, cz + s2, zone, hue);
    }
  };
  const z0 = j => -j * D;

  // 0 · catalog field + tunnel
  (() => {
    for (let i = 0, n = 720 * Q; i < n; i++) { const x = R(-40, 40), y = R(-24, 24); if (Math.abs(x) < 6 && Math.abs(y) < 4) continue; dot(x, y, R(-70, -4), 0, rnd() < .14 ? 1 : R(0, .2), R(1.2, 3)); }
    for (let i = 0; i < 10; i++) {
      const z = -6 - i * 6.5, r = 12 + (i % 2) * 1.6; ring(0, 0, z, r, 72, 'xy', 0, i % 4 === 0 ? .55 : .05);
      if (i) for (let k = 0; k < 12; k++) { const a = k * .5236 + (i % 2) * .26, a2 = k * .5236 + ((i - 1) % 2) * .26, rp = 12 + ((i - 1) % 2) * 1.6; ln(Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a2) * rp, Math.sin(a2) * rp, z + 6.5, 0, .05); }
    }
  })();
  // 1 · career ascent: five rising slabs, last one amber (applied AI)
  (() => {
    const Z = z0(1);
    for (let i = 0; i < 5; i++) {
      const cx = (i - 2) * 3.2, cy = -6 + i * 2.7, cz = Z - 7 - i * 7, hue = i === 4 ? 1 : i * .08;
      box(cx, cy, cz, 10, .5, 5.6, 1, hue);
      for (let g = -2; g <= 2; g++) ln(cx + g * 2, cy + .25, cz - 2.8, cx + g * 2, cy + .25, cz + 2.8, 1, hue);
      for (const sx of [-5, 5]) for (const sz of [-2.8, 2.8]) { ln(cx + sx, cy - .25, cz + sz, cx + sx, -16, cz + sz, 1, hue * .6); dot(cx + sx, cy + .25, cz + sz, 1, hue, 4); }
      pulse(cx - 5, cy + .6, cz, cx + 5, cy + .6, cz, 1, hue, 4, .35, i * .2);
    }
  })();
  // 2 · architecture: channels → commerce → integration → enterprise
  (() => {
    const Z = z0(2), layers = [{ n: 3, w: 5, hue: .0 }, { n: 1, w: 24, hue: 0.15 }, { n: 1, w: 24, hue: .15 }, { n: 3, w: 5, hue: 0 }];
    layers.forEach((L0, k) => {
      const z = Z - 6 - k * 9;
      ln(-16, -8, z, 16, -8, z, 2, .03); ln(16, -8, z, 16, 8, z, 2, .03); ln(16, 8, z, -16, 8, z, 2, .03); ln(-16, 8, z, -16, -8, z, 2, .03);
      for (let i = 0; i < L0.n; i++) { const x = L0.n === 1 ? 0 : (i - 1) * 9; box(x, 0, z, L0.w, 2.8, .9, 2, L0.hue); }
      if (k < 3) for (const x of [-9, 0, 9]) { ln(x, 0, z - .45, x, 0, z - 8.55, 2, .1); pulse(x, 0, z, x, 0, z - 9, 2, .05, 4.5, .28 + Math.abs(x) * .004, rnd()); pulse(x, 0, z - 9, x, 0, z, 2, .05, 3.5, .22, rnd()); }
    });
    // the AI layer begins to the right of the stack
    for (let i = 0; i < 3; i++) { const z = Z - 12 - i * 9; box(21, 0, z, 6, 2.4, .8, 2, 1); ln(14, 0, z, 18, 0, z, 2, .8); pulse(14, 0, z, 18, 0, z, 2, 1, 4, .4, i * .3); }
  })();
  // 3 · AI: layered neural mesh inside a guardrail cage
  (() => {
    const Z = z0(3), counts = [4, 6, 6, 3], nodes = counts.map((n, k) => Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * 3.6, Math.sin(i * 1.7 + k * 2) * 3, Z - 6 - k * 8]));
    nodes.forEach(l => l.forEach(([x, y, z]) => { dot(x, y, z, 3, 1, 6); ring(x, y, z, .55, 10, 'xy', 3, .9); }));
    for (let k = 0; k < 3; k++) nodes[k].forEach(a => nodes[k + 1].forEach(b => { ln(a[0], a[1], a[2], b[0], b[1], b[2], 3, .85); if (rnd() < .5) pulse(a[0], a[1], a[2], b[0], b[1], b[2], 3, 1, 3.5, R(.15, .45), rnd()); }));
    box(0, 0, Z - 15, 22, 13, 34, 3, .45);
    for (let g = 0; g < 9; g++) ln(-11 + g * 2.75, -6.5, Z + 2, -11 + g * 2.75, -6.5, Z - 32, 3, .35);
  })();
  // 4 · lab: 17 projects as a cube spiral (first six = flagships, amber)
  (() => {
    const Z = z0(4); let px, py, pz;
    for (let i = 0; i < 17; i++) {
      const a = i * .92 + .3, r = 7 + (i % 3) * 2.2, x = Math.cos(a) * r, y = Math.sin(a) * r * .62, z = Z - 4 - i * 2.3, s = i < 6 ? 2.7 : 1.7 + (i % 4) * .22, hue = i < 6 ? 1 : .03;
      box(x, y, z, s, s, s, 4, hue); dot(x, y, z, 4, hue, 5);
      if (i) ln(px, py, pz, x, y, z, 4, .5);
      [px, py, pz] = [x, y, z];
    }
  })();
  // 5 · destination: converging rays into a point-sphere
  (() => {
    const Z = z0(5), cz = Z - 16;
    for (let i = 0, n = 900 * Q; i < n; i++) { const u = rnd() * 2 - 1, t = rnd() * 6.2832, s = Math.sqrt(1 - u * u); dot(Math.cos(t) * s * 6.5, u * 6.5, cz + Math.sin(t) * s * 6.5, 5, (u + 1) / 2, R(1.4, 3.2)); }
    ring(0, 0, cz, 6.5, 64, 'xy', 5, .5); ring(0, 0, cz, 6.5, 64, 'xz', 5, .2); ring(0, 0, cz, 6.5, 64, 'yz', 5, .8);
    ring(0, 0, cz, 11, 80, 'xy', 5, .1); ring(0, 0, cz, 15, 96, 'xy', 5, .1);
    for (let k = 0, n = 28; k < n; k++) { const a = (k / n) * 6.2832, b = a + .3; ln(Math.cos(a) * 26, Math.sin(a) * 26, Z + 6, Math.cos(b) * 6.5, Math.sin(b) * 6.5 * .9, cz + 6, 5, k % 3 ? .1 : .9); }
  })();
  // continuity: ambient dust + velocity streaks along the entire path
  for (let i = 0, n = 1300 * Q; i < n; i++) { const a = rnd() * 6.2832, r = R(3.5, 30); dot(Math.cos(a) * r, Math.sin(a) * r * .75, R(-345, 12), -1, rnd() < .1 ? 1 : R(0, .25), R(.9, 1.8)); }
  for (let i = 0, n = 380 * Q; i < n; i++) { const a = rnd() * 6.2832, r = R(3, 26), x = Math.cos(a) * r, y = Math.sin(a) * r * .75, z = R(-345, 12), h = R(0, .3); V(ST, x, y, z, -1, h, 0, x, y, z, 0, 0); V(ST, x, y, z, -1, h, 0, x, y, z, -1, 0); }

  /* ---------- GL plumbing ---------- */
  const VS = `precision highp float;
attribute vec3 aPos;attribute vec3 aMeta;attribute vec3 aEnd;attribute vec2 aAnim;
uniform mat4 uVP;uniform float uZone,uTime,uVel,uPx,uMode,uDim;
varying vec3 vCol;varying float vPt;
void main(){
  vec3 p=aPos;
  if(aAnim.x>0.0){p=mix(aPos,aEnd,fract(uTime*aAnim.x+aAnim.y));}
  if(aAnim.x<-0.5){p.z-=uVel*20.0;}
  vec4 c=uVP*vec4(p,1.0);
  float d=c.w;
  float b=aMeta.x<-0.5?0.5:0.2+0.8*(1.0-smoothstep(0.5,1.5,abs(uZone-aMeta.x)));
  float fade=smoothstep(0.7,3.5,d)*(1.0-smoothstep(34.0,96.0,d));
  vec3 col=mix(vec3(0.36,0.62,0.86),vec3(0.93,0.66,0.31),aMeta.y);
  col+=vec3(0.22)*min(1.0,abs(uVel));
  float k=uMode<0.5?0.9:(uMode<1.5?1.3:(0.12+min(1.0,abs(uVel)*1.6))*0.9);
  vCol=col*b*fade*k*uDim;
  vPt=(uMode>0.5&&uMode<1.5)?1.0:0.0;
  gl_Position=c;
  gl_PointSize=clamp(aMeta.z*uPx*(52.0/max(d,1.0)),1.0,16.0*uPx);
}`;
  const FS = `precision mediump float;varying vec3 vCol;varying float vPt;
void main(){float a=1.0;if(vPt>0.5){float r=length(gl_PointCoord-0.5);a=smoothstep(0.5,0.0,r);a*=a;}gl_FragColor=vec4(vCol*a,1.0);}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn('world.js shader:', gl.getShaderInfoLog(o)); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('world.js link:', gl.getProgramInfoLog(prog)); return fail(); }
  gl.useProgram(prog);
  const U = n => gl.getUniformLocation(prog, n), A = n => gl.getAttribLocation(prog, n);
  const u = { vp: U('uVP'), zone: U('uZone'), dim: U('uDim'), time: U('uTime'), vel: U('uVel'), px: U('uPx'), mode: U('uMode') };
  const mk = arr => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); return { b, n: arr.length / 11 }; };
  const bufs = { line: mk(LN), point: mk(PT), streak: mk(ST) };
  const attrs = [['aPos', 3, 0], ['aMeta', 3, 3], ['aEnd', 3, 6], ['aAnim', 2, 9]].map(([n, s, o]) => [A(n), s, o * 4]);
  const draw = (buf, prim, mode) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.b);
    attrs.forEach(([loc, size, off]) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 44, off); });
    gl.uniform1f(u.mode, mode); gl.drawArrays(prim, 0, buf.n);
  };
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);

  /* ---------- camera ---------- */
  const ZONES = 6, PATH = [[0, 0, 0], [-1.5, 2, .03], [0, 0, 0], [1.2, -.4, -.03], [-1, .8, .04], [0, 0, 0]];
  const smooth = t => t * t * (3 - 2 * t);
  const path = t => {
    const c = Math.min(Math.max(t, 0), ZONES - 1), i = Math.min(Math.floor(c), ZONES - 2), f = smooth(c - i), a = PATH[i], b = PATH[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, -t * D, a[2] + (b[2] - a[2]) * f];
  };
  const TINT = [[.016, .024, .04], [.018, .026, .045], [.014, .024, .04], [.04, .028, .02], [.03, .03, .042], [.02, .022, .04]];
  const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
  const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); };
  const look = (e, t, roll) => {
    let fx = t[0] - e[0], fy = t[1] - e[1], fz = t[2] - e[2]; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
    let ux = Math.sin(roll), uy = Math.cos(roll), uz = 0;
    let sx = fy * uz - fz * uy, sy = fz * ux - fx * uz, sz = fx * uy - fy * ux; const sl = Math.hypot(sx, sy, sz); sx /= sl; sy /= sl; sz /= sl;
    ux = sy * fz - sz * fy; uy = sz * fx - sx * fz; uz = sx * fy - sy * fx;
    return new Float32Array([sx, ux, -fx, 0, sy, uy, -fy, 0, sz, uz, -fz, 0, -(sx * e[0] + sy * e[1] + sz * e[2]), -(ux * e[0] + uy * e[1] + uz * e[2]), fx * e[0] + fy * e[1] + fz * e[2], 1]);
  };

  /* ---------- state / loop ---------- */
  const tgt = { zone: still && !reduce ? .35 : 0, vel: 0, dim: still ? .4 : 1 }, cur = { zone: tgt.zone, vel: 0, dim: tgt.dim, mx: 0, my: 0 }, ptr = { x: 0, y: 0 };
  let W = 0, H = 0, dpr = 1, last = performance.now(), raf = 0, t0 = last;
  const size = force => {
    const w = innerWidth, h = innerHeight;
    // ignore URL-bar-only height changes on phones (scroll-world: no jump on mobile chrome collapse)
    if (!force && w === W && Math.abs(h - H) < 120) return;
    W = w; H = h; dpr = Math.min(devicePixelRatio || 1, coarse ? 1 : 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); gl.viewport(0, 0, canvas.width, canvas.height);
  };
  let skip = false;
  const frame = (now) => {
    raf = 0;
    // idle (not scrolling): 30fps is plenty for the drifting pulses; full rate only while moving
    const moving = Math.abs(cur.vel) > .03 || Math.abs(tgt.zone - cur.zone) > .002;
    if (!still && !moving && (skip = !skip)) { if (!document.hidden) raf = requestAnimationFrame(frame); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 5.5);
    cur.zone += (tgt.zone - cur.zone) * k;
    cur.vel += (tgt.vel - cur.vel) * (1 - Math.exp(-dt * 9)); cur.dim += (tgt.dim - cur.dim) * (1 - Math.exp(-dt * 6));
    cur.mx += (ptr.x - cur.mx) * (1 - Math.exp(-dt * 3)); cur.my += (ptr.y - cur.my) * (1 - Math.exp(-dt * 3));
    const z = cur.zone, v = still ? 0 : cur.vel, p = path(z), l = path(z + .12), asp = W / H;
    const eye = [p[0] + cur.mx * .6, p[1] + cur.my * .4, p[2]], tg = [l[0] + cur.mx * 2.4, l[1] - cur.my * 1.4, l[2] - 6];
    const fov = ((asp < 1 ? 78 : 58) + Math.min(1.5, Math.abs(v)) * 14) * Math.PI / 180;
    const vp = mul(persp(fov, asp, .1, 220), look(eye, tg, p[3] + v * -.045));
    const i = Math.min(Math.floor(Math.min(Math.max(z, 0), ZONES - 1)), ZONES - 2), f = Math.min(Math.max(z, 0), ZONES - 1) - i, a = TINT[i], b = TINT[i + 1];
    gl.clearColor(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(u.vp, false, vp); gl.uniform1f(u.zone, z); gl.uniform1f(u.time, still ? 0 : (now - t0) / 1000); gl.uniform1f(u.vel, v); gl.uniform1f(u.px, dpr); gl.uniform1f(u.dim, cur.dim);
    draw(bufs.line, gl.LINES, 0); draw(bufs.point, gl.POINTS, 1);
    if (!still && Math.abs(v) > .02) draw(bufs.streak, gl.LINES, 2);
    if (!still && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  size(true);
  addEventListener('resize', () => { size(); if (still) kick(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); fail(); });
  if (!still && matchMedia('(hover:hover) and (pointer:fine)').matches)
    addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  root.classList.add('has-3d');
  window.World = {
    // reduced motion: a single static establishing frame, no travel
    set(zone, vel, dim) { if (still) return; tgt.zone = Math.min(Math.max(zone, 0), ZONES - 1); tgt.vel = vel; if (dim != null) tgt.dim = dim; kick(); },
    zones: ZONES
  };
  kick();
})();
