// Keep this migration aligned with shared/preferences.ts to avoid a theme flash.
(() => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('voya-preferences') || '{}') || {}; } catch { /* Use defaults when storage is unavailable. */ }
  const root = document.documentElement;
  const followsDevice = saved.theme === 'system' && saved.appearanceVersion === 1;
  const theme = saved.theme === 'dark' || (followsDevice && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  root.dataset.theme = theme;
  root.dataset.contrast = saved.contrast === 'high' ? 'high' : 'standard';
  root.dataset.motion = saved.reducedMotion === true ? 'reduced' : 'standard';
  root.lang = ['en', 'es', 'fr'].includes(saved.language) ? saved.language : 'en';
})();
