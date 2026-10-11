/* ============================================================================
   motion.js — scroll orchestration
   - Lenis (darkroomengineering/lenis, MIT): smooth scroll + scroll velocity. Driven from
     GSAP's ticker exactly as in the Lenis README ("GSAP ScrollTrigger" recipe).
   - GSAP + ScrollTrigger: hero dive (scrubbed), text reveals, career-step tilt.
   - scroll-world (oso95, MIT): scroll position -> position along ONE scene chain, with a
     per-scene dwell ("linger") so the camera settles where the copy peaks.
   - Velocity is used for real, not just smoothing: it stretches the star streaks and
     widens the FOV in WebGL, skews headings, tilts cards and drives the marquee.
   Everything is torn down on pagehide; reduced motion gets native scroll and no travel.
   ========================================================================== */
(() => {
  const d = document, root = d.documentElement, g = window.gsap, ST = window.ScrollTrigger;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const home = !!d.querySelector('[data-scenes]');
  const hdrH = () => (d.querySelector('.hdr') || { offsetHeight: 64 }).offsetHeight;
  const cleanups = [];
  const on = (t, e, f, o) => { t.addEventListener(e, f, o); cleanups.push(() => t.removeEventListener(e, f, o)); };

  /* ---------- Lenis ---------- */
  let lenis = null;
  if (!reduce && window.Lenis && g) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .95, autoRaf: false, anchors: false });
    root.classList.add('lenis-on');
    g.registerPlugin(ST);
    lenis.on('scroll', ST.update);
    const raf = t => lenis.raf(t * 1000);
    g.ticker.add(raf); g.ticker.lagSmoothing(0);
    cleanups.push(() => { g.ticker.remove(raf); lenis.destroy(); });
    on(d, 'nav:toggle', e => (e.detail ? lenis.stop() : lenis.start()));
  } else if (g && ST && !reduce) g.registerPlugin(ST);

  const scrollTo = (target, immediate) => {
    const el = typeof target === 'string' ? d.querySelector(target) : target; if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - hdrH() - 8;
    if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.9, easing: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
    else window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
  };

  // same-page anchors (also "/#id" while on the home page) — keeps history/hash behaviour
  on(d, 'click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname !== location.pathname || !u.hash || u.hash === '#') return;
    const el = d.getElementById(decodeURIComponent(u.hash.slice(1))); if (!el) return;
    e.preventDefault(); history.pushState(null, '', u.hash); scrollTo(el);
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
  });
  if (location.hash) addEventListener('load', () => { const el = d.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) setTimeout(() => scrollTo(el, true), 60); }, { once: true });

  /* ---------- scene chain (scroll position -> zone) ---------- */
  const SCENES = [['Entry', '#top-scene'], ['Ascent', '#experience'], ['Architecture', '#architecture'], ['Intelligence', '#ai'], ['Lab', '#lab'], ['Skills', '#skills'], ['Destination', '#contact']];
  const BOUNDS = [0, .5, 1.5, 2.5, 3.5, 4.5, 4.8, 5];            // zone at the top/bottom edge of each section
  const LINGER = [.15, .55, .5, .5, .5, .3, .2];                   // scroll-world "linger": slow in the middle, quick at the edges
  let segs = [];
  const measure = () => {
    const els = SCENES.map(([, s]) => (s === '#top-scene' ? d.querySelector('.hero') : d.querySelector(s)));
    segs = els.map((el, i) => { if (!el) return null; const r = el.getBoundingClientRect(); return { el, top: r.top + scrollY, bot: r.bottom + scrollY, z0: BOUNDS[i], z1: BOUNDS[i + 1], l: LINGER[i], i }; }).filter(Boolean);
  };
  const zoneAt = (y) => {
    if (!segs.length) return 0;
    let s = segs[segs.length - 1];
    for (const c of segs) if (y < c.bot) { s = c; break; }
    const f = clamp((y - s.top) / Math.max(1, s.bot - s.top), 0, 1), fl = f + s.l * Math.sin(6.2832 * f) / 6.2832;
    return { zone: s.z0 + (s.z1 - s.z0) * fl, seg: s };
  };

  /* ---------- HUD + rail ---------- */
  const hud = d.querySelector('.hud'), hudScene = d.querySelector('.hud-scene'), hudVel = d.querySelector('.hud-vel i'), hudNum = d.querySelector('.hud-num');
  const rail = [...d.querySelectorAll('.rail a')];
  let lastScene = -1;
  const setScene = i => {
    if (i === lastScene) return; lastScene = i;
    if (hudScene) hudScene.textContent = String(i + 1).padStart(2, '0') + ' / 07 — ' + SCENES[i][0];
    rail.forEach(a => { const on_ = a.getAttribute('href') === (SCENES[i][1] === '#top-scene' ? '#top' : SCENES[i][1]); a.classList.toggle('on', on_); on_ ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'); });
  };

  /* ---------- per-frame: zone + velocity -> world, skew, marquee ---------- */
  const skewEls = [...d.querySelectorAll('[data-vel]')].map(el => ({ el, set: g ? g.quickSetter(el, 'skewY', 'deg') : null, vis: true }));
  if (g && 'IntersectionObserver' in window && skewEls.length) {
    const io = new IntersectionObserver(es => es.forEach(e => { const o = skewEls.find(s => s.el === e.target); if (o) o.vis = e.isIntersecting; }), { rootMargin: '10% 0px' });
    skewEls.forEach(s => io.observe(s.el)); cleanups.push(() => io.disconnect());
  }
  const marq = [...d.querySelectorAll('.marquee')].map(el => { const t = el.firstElementChild; return { el, t, x: 0, w: 0 }; });
  const sizeMarq = () => marq.forEach(m => { m.w = m.t.scrollWidth / 2; });
  let lastY = scrollY, vel = 0, lastT = performance.now(), maxS = 1;
  const tick = () => {
    const now = performance.now(), dt = Math.max(1, now - lastT); lastT = now;
    const y = lenis ? lenis.scroll : scrollY, raw = (y - lastY) / dt * 16.7; lastY = y;     // px per 60Hz frame
    vel += (raw - vel) * .35;
    const vn = clamp(vel / 38, -1.5, 1.5);
    maxS = Math.max(1, root.scrollHeight - innerHeight);
    const p = clamp(y / maxS, 0, 1);
    let z = 0, seg = null;
    if (home) { const r = zoneAt(y + innerHeight * (.5 + .5 * p)); if (r) { z = r.zone; seg = r.seg; } }
    else { z = .1 + p * 1.6; }
    if (window.World) World.set(z, vn);
    if (home && seg) setScene(seg.i);
    if (hudVel) hudVel.style.transform = 'scaleX(' + clamp(Math.abs(vn) / 1.2, 0, 1).toFixed(3) + ')';
    if (hudNum) hudNum.textContent = Math.abs(vel).toFixed(1).padStart(4, '0');
    if (!reduce) {
      const sk = clamp(-vn * 2.6, -4, 4);
      skewEls.forEach(s => s.vis && s.set && s.set(sk));
      marq.forEach((m, i) => { if (!m.w) return; m.x -= (1.1 + Math.abs(vn) * 9) * (vn < -.02 ? -1 : 1) * (i % 2 ? -1 : 1) * dt / 16.7; m.x = ((m.x % m.w) - m.w) % m.w; m.t.style.transform = 'translate3d(' + m.x.toFixed(1) + 'px,0,0)'; });
    }
  };
  if (reduce) { on(window, 'scroll', tick, { passive: true }); } else if (g) { g.ticker.add(tick); cleanups.push(() => g.ticker.remove(tick)); }
  else { const loop = () => { tick(); id = requestAnimationFrame(loop); }; let id = requestAnimationFrame(loop); cleanups.push(() => cancelAnimationFrame(id)); }

  /* ---------- GSAP choreography ---------- */
  const split = (el, mode) => {
    const text = el.textContent.trim(); el.setAttribute('aria-label', text); el.textContent = '';
    const out = [];
    text.split(/\s+/).forEach((w, wi, arr) => {
      const word = d.createElement('span'); word.className = 'sw'; word.setAttribute('aria-hidden', 'true');
      const parts = mode === 'chars' ? [...w] : [w];
      parts.forEach(c => { const s = d.createElement('span'); s.className = 'sc'; s.textContent = c; word.appendChild(s); out.push(s); });
      el.appendChild(word); if (wi < arr.length - 1) el.appendChild(d.createTextNode(' '));
    });
    return out;
  };

  let mm = null;
  if (g && ST) {
    mm = g.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // hero: letters rise in, then the title "dives" toward the camera as you scroll
      const h1 = d.querySelector('.hero h1');
      if (h1) {
        const chars = split(h1, 'chars');
        g.from(chars, { yPercent: 115, rotateX: -70, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .045, delay: .15 });
        g.from('.hero-in > *:not(h1)', { y: 26, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .09, delay: .5, clearProps: 'transform,opacity' });
        if (getComputedStyle(d.querySelector('.hero-stick')).position === 'sticky') g.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 40%', scrub: .6 } })
          .to(h1, { scale: 1.22, yPercent: -8, opacity: 0, filter: 'blur(5px)', ease: 'power2.in', transformOrigin: '0% 60%' }, 0)
          .to('.hero-in > *:not(h1)', { y: -50, opacity: 0, ease: 'none', stagger: .02 }, 0)
          .to('.scroll-cue', { opacity: 0, y: 20, ease: 'none' }, 0);
      }
      // section headings: words ride up out of a mask
      d.querySelectorAll('.sec-head h2, .ph h1').forEach(h => {
        const words = split(h, 'words');
        g.from(words, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
      });
      // career steps: tilt in from depth, scrubbed (3D feel without leaving the DOM)
      d.querySelectorAll('.prog > li').forEach(li => {
        li.classList.remove('rv');
        g.fromTo(li, { y: 70, rotateX: -14, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%' }, { y: 0, rotateX: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 98%', end: 'top 62%', scrub: .5 } });
      });
      // architecture chain: cascade
      const chain = d.querySelector('.chain');
      if (chain) g.from(chain.children, { y: 40, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07, clearProps: 'transform,opacity', scrollTrigger: { trigger: chain, start: 'top 85%', once: true } });
      // lab/flagship cards: pointer tilt (hover devices only)
      if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
        d.querySelectorAll('a.card.flag, .ai-card').forEach(c => {
          const rx = g.quickTo(c, 'rotateX', { duration: .5, ease: 'power3.out' }), ry = g.quickTo(c, 'rotateY', { duration: .5, ease: 'power3.out' });
          g.set(c, { transformPerspective: 900 });
          const mv = e => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 7); rx(-((e.clientY - r.top) / r.height - .5) * 7); };
          const lv = () => { rx(0); ry(0); };
          c.addEventListener('pointermove', mv); c.addEventListener('pointerleave', lv);
        });
      }
      ST.refresh();
    });
  }

  /* ---------- measuring ---------- */
  sizeMarq(); measure();
  const remeasure = () => { measure(); sizeMarq(); };
  if (ST) ST.addEventListener('refresh', remeasure);
  on(window, 'resize', remeasure, { passive: true });
  on(window, 'load', () => { remeasure(); ST && ST.refresh(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { remeasure(); ST && ST.refresh(); });
  d.querySelectorAll('details').forEach(el => on(el, 'toggle', () => setTimeout(() => { remeasure(); ST && ST.refresh(); }, 30)));
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => remeasure()); ro.observe(d.querySelector('main') || d.body); cleanups.push(() => ro.disconnect()); }

  // free everything when the page is discarded (bfcache keeps the page alive otherwise)
  on(window, 'pagehide', e => { if (!e.persisted) { mm && mm.revert(); cleanups.splice(0).forEach(f => f()); } });
  tick();
})();
