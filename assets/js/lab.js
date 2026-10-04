(() => {
  // Filter (lab index)
  const bar = document.querySelector('.filters');
  if (bar) {
    const cards = [...document.querySelectorAll('.card[data-cluster]')], blocks = [...document.querySelectorAll('.tier-block')];
    const status = document.getElementById('filter-status');
    bar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      const f = b.dataset.f; let n = 0;
      cards.forEach(c => { const show = f === 'all' || c.dataset.cluster === f; c.hidden = !show; if (show) n++; });
      blocks.forEach(bl => { bl.hidden = !bl.querySelector('.card:not([hidden])'); });
      status.textContent = n + ' project' + (n === 1 ? '' : 's') + ' shown';
    });
  }
  // Demo loader (project pages)
  const el = document.querySelector('[data-demo]');
  if (el) {
    import('/assets/js/demos/' + el.dataset.demo + '.js')
      .then(m => { el.replaceChildren(); m.mount(el); })
      .catch(err => { console.error(err); el.textContent = 'The demo could not be loaded. The write-up below covers the same material.'; });
  }
})();
