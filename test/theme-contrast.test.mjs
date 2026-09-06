import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const css = postcss.parse(readFileSync(new URL('../src/index.css', import.meta.url), 'utf8'));
function palette(theme, contrast) {
  const selectors = new Set([':root']);
  if (theme === 'dark') selectors.add(':root[data-theme="dark"]');
  if (contrast === 'high') selectors.add(':root[data-contrast="high"]');
  if (theme === 'dark' && contrast === 'high') selectors.add(':root[data-theme="dark"][data-contrast="high"]');
  const colors = {};
  css.walkRules(rule => {
    if (selectors.has(rule.selector)) rule.walkDecls(decl => { colors[decl.prop] = decl.value; });
  });
  return colors;
}
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  });
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrastRatio(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

for (const theme of ['light', 'dark']) for (const contrast of ['standard', 'high']) {
  test(`${theme} / ${contrast}: text and actions stay readable across surfaces`, () => {
    const colors = palette(theme, contrast);
    const minimum = contrast === 'high' ? 7 : 4.5;
    for (const foreground of ['--ink', '--muted', '--subtle', '--accent']) {
      for (const background of ['--canvas', '--surface', '--surface-alt']) {
        const ratio = contrastRatio(colors[foreground], colors[background]);
        assert.ok(ratio >= minimum, `${foreground} on ${background}: ${ratio.toFixed(2)} < ${minimum}`);
      }
    }
    for (const background of ['--action', '--action-hover']) {
      assert.ok(contrastRatio(colors['--action-ink'], colors[background]) >= minimum);
    }
    assert.ok(contrastRatio(colors['--map-label-ink'], colors['--map-label']) >= minimum);
  });
}
