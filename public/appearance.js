// Apply device preferences before React loads to avoid a light flash in dark mode.
(() => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('voya-preferences') || '{}') || {}; } catch { /* Use defaults when storage is unavailable. */ }
  const root = document.documentElement;
  const theme = ['light', 'dark'].includes(saved.theme) ? saved.theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.dataset.theme = theme;
  root.dataset.contrast = saved.contrast === 'high' ? 'high' : 'standard';
  root.dataset.motion = saved.reducedMotion === true ? 'reduced' : 'standard';
  root.lang = ['en', 'es', 'fr'].includes(saved.language) ? saved.language : 'en';
})();
