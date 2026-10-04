(() => {
  const d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.documentElement.classList.remove('no-js');

  // Mobile menu
  const btn = d.querySelector('.menu-btn'), nav = d.getElementById('nav');
  if (btn && nav) {
    const set = o => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); btn.textContent = o ? 'Close' : 'Menu'; };
    btn.addEventListener('click', () => set(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  // Reveal on scroll
  const rv = [...d.querySelectorAll('.rv')];
  if (rv.length) {
    if (reduce || !('IntersectionObserver' in window)) rv.forEach(el => el.classList.add('in'));
    else {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
      rv.forEach(el => io.observe(el));
    }
  }

  // Career progression: fill line + activate steps as they cross the viewport middle
  const prog = d.querySelector('.prog');
  if (prog) {
    const items = [...prog.children];
    const upd = () => {
      const r = prog.getBoundingClientRect(), mid = innerHeight * .55;
      const pct = Math.min(100, Math.max(0, ((mid - r.top) / r.height) * 100));
      prog.style.setProperty('--fill', (reduce ? 100 : pct) + '%');
      items.forEach(li => li.classList.toggle('on', reduce || li.getBoundingClientRect().top < mid));
    };
    upd(); addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd);
  }

  // Hero architecture graph: select a node to read its role
  const arch = d.querySelector('.arch');
  if (arch) {
    const info = arch.querySelector('.arch-info');
    const src = {}; arch.querySelectorAll('.arch-d .node').forEach(n => src[n.getAttribute('aria-label')] = n);
    arch.querySelectorAll('.arch-m .node').forEach(n => { const o = src[n.getAttribute('aria-label')]; if (o) { n.dataset.t = o.dataset.t; n.dataset.d = o.dataset.d; } });
    const show = n => {
      arch.querySelectorAll('.node').forEach(x => x.classList.toggle('sel', x.getAttribute('aria-label') === n.getAttribute('aria-label')));
      info.innerHTML = '';
      const b = d.createElement('b'); b.textContent = n.dataset.t + ' — ';
      info.append(b, n.dataset.d);
    };
    arch.querySelectorAll('.node').forEach(n => {
      n.addEventListener('click', () => show(n));
      n.addEventListener('mouseenter', () => show(n));
      n.addEventListener('focus', () => show(n));
      n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(n); } });
    });
  }
})();
