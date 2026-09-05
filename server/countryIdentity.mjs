import { getData } from 'country-list';

const normalize = value => String(value).normalize('NFD').replace(/\p{M}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
const countries = new Map();
const names = new Intl.DisplayNames(['en'], { type: 'region' });
for (const { code, name } of getData()) {
  countries.set(normalize(name), code);
  countries.set(normalize(names.of(code)), code);
}
for (const [alias, code] of Object.entries({
  usa: 'US', us: 'US', 'united states of america': 'US', uk: 'GB',
  'great britain': 'GB', 'south korea': 'KR', 'north korea': 'KP',
  russia: 'RU', vietnam: 'VN', taiwan: 'TW', bolivia: 'BO',
  iran: 'IR', syria: 'SY', laos: 'LA', venezuela: 'VE',
  tanzania: 'TZ', moldova: 'MD', 'czech republic': 'CZ',
  turkey: 'TR', 'ivory coast': 'CI', 'cape verde': 'CV',
  palestine: 'PS', 'vatican city': 'VA', 'east timor': 'TL',
})) countries.set(normalize(alias), code);

// Deliberately no fuzzy matching or automatic spelling correction.
export function resolveCountryCode(input) {
  return typeof input === 'string' ? countries.get(normalize(input)) || null : null;
}
