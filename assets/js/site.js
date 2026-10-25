'use strict';
// Light / dark switch for the landing, guide and 404 pages (the planner has its own in app.js)
(function(){
  const order = ['auto', 'light', 'dark'], label = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  const get = () => { try { return localStorage.getItem('pp-theme') || 'auto'; } catch (e) { return 'auto'; } };
  const apply = () => {
    const t = get();
    if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    document.querySelectorAll('[data-act="theme"]').forEach(b => { b.dataset.mode = t; b.querySelector('.tl').textContent = label[t]; b.title = 'Theme: ' + label[t] + ' (click to change)'; });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act="theme"]'); if (!b) return;
    const next = order[(order.indexOf(get()) + 1) % 3];
    try { localStorage.setItem('pp-theme', next); } catch (err) {}
    apply();
  });
  apply();
  // visit counting opt-out (guide page)
  const st = document.getElementById('statsState');
  const showStats = () => { if (st) st.textContent = (typeof statsOptedOut === 'function' && statsOptedOut()) ? 'Off in this browser.' : ''; };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act="stats-optout"]'); if (!b) return;
    try { localStorage.setItem('pp-no-stats', '1'); } catch (err) {}
    showStats();
  });
  showStats();
})();
