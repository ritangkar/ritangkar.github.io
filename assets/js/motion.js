/* ============================================================================
   motion.js — home-page scroll orchestration (loaded on the home page only)
   - Lenis (darkroomengineering/lenis, MIT): smooth wheel scroll, driven from GSAP's ticker
     (the Lenis README "GSAP ScrollTrigger" recipe). Touch devices keep native scrolling.
   - GSAP + ScrollTrigger: hero intro + dive, heading word reveals.
   - scroll-world (oso95, MIT) idea: scroll position -> position along ONE scene chain with a
     per-scene dwell ("linger"). Scroll velocity feeds the WebGL world (streaks, FOV, roll).
   Reduced motion: native scroll, no GSAP choreography, no camera travel.
   ========================================================================== */
(() => {
  const d = document, g = window.gsap, ST = window.ScrollTrigger;
  if (!d.querySelector('[data-scenes]')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hdrH = () => (d.querySelector('.hdr') || { offsetHeight: 64 }).offsetHeight;
  const cleanups = [];
  const on = (t, e, f, o) => { t.addEventListener(e, f, o); cleanups.push(() => t.removeEventListener(e, f, o)); };

  /* ---------- Lenis (desktop wheel only) ---------- */
  let lenis = null;
  if (g && ST && !reduce) g.registerPlugin(ST);
  if (!reduce && !coarse && window.Lenis && g && ST) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true, autoRaf: false, anchors: false });
    d.documentElement.classList.add('lenis-on');
    lenis.on('scroll', ST.update);
    const raf = t => lenis.raf(t * 1000);
    g.ticker.add(raf); g.ticker.lagSmoothing(0);
    cleanups.push(() => { g.ticker.remove(raf); lenis.destroy(); });
    on(d, 'nav:toggle', e => (e.detail ? lenis.stop() : lenis.start()));
  }

  const scrollTo = (el, immediate) => {
    const y = el.getBoundingClientRect().top + scrollY - hdrH() - 8;
    if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.6, easing: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
    else window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
  };
  on(d, 'click', e => {   // same-page anchors, incl. "/#id" while on the home page
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname !== location.pathname || !u.hash || u.hash === '#') return;
    const el = d.getElementById(decodeURIComponent(u.hash.slice(1))); if (!el) return;
    e.preventDefault(); history.pushState(null, '', u.hash); scrollTo(el);
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
  });
  if (location.hash) on(window, 'load', () => { const el = d.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) setTimeout(() => scrollTo(el, true), 60); }, { once: true });

  /* ---------- scene chain: scroll position -> camera zone ---------- */
  const SCENES = ['#top', '#experience', '#architecture', '#ai', '#lab', '#skills', '#contact'];
  const BOUNDS = [0, .5, 1.5, 2.5, 3.5, 4.5, 4.8, 5];          // zone at the top/bottom edge of each section
  const LINGER = [.15, .55, .5, .5, .5, .3, .2];                 // slow in the middle of a scene, quick at the edges
  const rail = [...d.querySelectorAll('.rail a')];
  let segs = [], active = -1;
  const measure = () => {
    segs = SCENES.map((s, i) => { const el = d.querySelector(s === '#top' ? '.hero' : s); if (!el) return null; const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bot: r.bottom + scrollY, z0: BOUNDS[i], z1: BOUNDS[i + 1], l: LINGER[i], i }; }).filter(Boolean);
  };
  const zoneAt = y => {
    let s = segs[segs.length - 1];
    for (const c of segs) if (y < c.bot) { s = c; break; }
    const f = clamp((y - s.top) / Math.max(1, s.bot - s.top), 0, 1);
    return { zone: s.z0 + (s.z1 - s.z0) * (f + s.l * Math.sin(6.2832 * f) / 6.2832), i: s.i };
  };
  const setActive = i => {
    if (i === active) return; active = i;
    rail.forEach(a => { const o = a.getAttribute('href') === SCENES[i]; a.classList.toggle('on', o); o ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'); });
  };

  /* ---------- per frame: zone + velocity -> world ---------- */
  let lastY = scrollY, vel = 0, lastT = performance.now();
  const tick = () => {
    if (!segs.length) return;
    const now = performance.now(), dt = Math.max(1, now - lastT); lastT = now;
    const y = lenis ? lenis.scroll : scrollY;
    vel += ((y - lastY) / dt * 16.7 - vel) * .3; lastY = y;                // px per 60Hz frame, smoothed
    const max = Math.max(1, d.documentElement.scrollHeight - innerHeight), p = clamp(y / max, 0, 1);
    const r = zoneAt(y + innerHeight * (.5 + .5 * p));
    // scene brightness: full in the hero, calmer behind reading content
    const dim = coarse ? .5 : .62, hero = clamp(1 - y / (innerHeight * .9), 0, 1);
    if (window.World) World.set(r.zone, clamp(vel / 38, -1.5, 1.5), dim + (1 - dim) * hero);
    setActive(r.i);
  };
  if (reduce) on(window, 'scroll', tick, { passive: true });
  else if (g) { g.ticker.add(tick); cleanups.push(() => g.ticker.remove(tick)); }

  /* ---------- GSAP: hero + headings (kept deliberately small) ---------- */
  const split = (el, chars) => {
    const text = el.textContent.trim(); el.setAttribute('aria-label', text); el.textContent = '';
    const out = [];
    text.split(/\s+/).forEach((w, wi, arr) => {
      const word = d.createElement('span'); word.className = 'sw'; word.setAttribute('aria-hidden', 'true');
      (chars ? [...w] : [w]).forEach(c => { const s = d.createElement('span'); s.className = 'sc'; s.textContent = c; word.appendChild(s); out.push(s); });
      el.appendChild(word); if (wi < arr.length - 1) el.appendChild(d.createTextNode(' '));
    });
    return out;
  };
  let mm = null;
  if (g && ST) {
    mm = g.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const h1 = d.querySelector('.hero h1');
      if (h1) {
        g.from(split(h1, true), { yPercent: 115, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .04, delay: .1 });
        g.from('.hero-in > *:not(h1)', { y: 22, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .45, clearProps: 'transform,opacity' });
        if (getComputedStyle(d.querySelector('.hero-stick')).position === 'sticky')
          g.to('.hero-in', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '25% top', end: 'bottom 45%', scrub: true } });
      }
      d.querySelectorAll('.sec-head h2').forEach(h => g.from(split(h, false), { yPercent: 105, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } }));
    });
  }

  /* ---------- measuring ---------- */
  measure();
  const remeasure = () => measure();
  if (ST) ST.addEventListener('refresh', remeasure);
  on(window, 'resize', remeasure, { passive: true });
  on(window, 'load', () => { remeasure(); ST && ST.refresh(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { remeasure(); ST && ST.refresh(); });
  d.querySelectorAll('details').forEach(el => on(el, 'toggle', () => setTimeout(() => { remeasure(); ST && ST.refresh(); }, 30)));
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(remeasure); ro.observe(d.querySelector('main')); cleanups.push(() => ro.disconnect()); }
  on(window, 'pagehide', e => { if (!e.persisted) { mm && mm.revert(); cleanups.splice(0).forEach(f => f()); } });
  tick();
})();
