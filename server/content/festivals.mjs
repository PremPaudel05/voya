import Holidays from 'date-holidays';
import { getAllCountries } from 'country-info-pro';
import { resolveCountryCode } from '../countryIdentity.mjs';
import { festivalHighlights } from './festival-highlights.mjs';
import guideSources from './holiday-sources.mjs';

const supported = new Set(getAllCountries().map(country => country.cca2));
const calendars = new Holidays().getCountries('en');
const noResidentCalendar = new Set(['AQ', 'BV', 'GS', 'HM', 'TF', 'UM']);
const cache = new Map();
const excludedNames = /tax day|administrative professionals|daylight saving|election day/i;
const lunarRule = /Muharram|Safar|Rabi|Jumada|Rajab|Shaban|Shaaban|Ramadan|Shawwal|Dhu|islamic/i;
export const calendarAttribution = {
  title: 'date-holidays contributors · calendar data: CC BY-SA 3.0',
  url: 'https://github.com/commenthol/date-holidays',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  noticesUrl: '/credits/date-holidays.txt',
};
const opm = { title: 'US Office of Personnel Management — Federal holidays', url: 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/' };
const cra = { title: 'Canada Revenue Agency — Public holidays', url: 'https://www.canada.ca/en/revenue-agency/services/tax/public-holidays.html' };
const pakistan = { title: 'Pakistan Cabinet Division — 2026 holidays', url: 'https://www.cabinet.gov.pk/SiteImage/Misc/files/Holidays/2026/Public-Holidays-2026.pdf' };

export function getCountryFestivals(nameOrCode, year = new Date().getUTCFullYear()) {
  const input = String(nameOrCode || '').trim();
  const code = supported.has(input.toUpperCase()) ? input.toUpperCase() : resolveCountryCode(input);
  if (!supported.has(code)) return null;
  if (!Number.isInteger(year) || year < 2020 || year > 2099) throw new RangeError('Unsupported calendar year');
  const key = `${code}:${year}`;
  if (cache.has(key)) return cache.get(key);
  const providerSource = { title: `date-holidays — ${code} calendar and underlying references`, url: `https://github.com/commenthol/date-holidays/blob/master/data/countries/${code}.yaml` };
  const highlights = (festivalHighlights[code] || []).map(item => ({ ...item }));
  let calendar = [];
  let note = 'A selection of celebrations and calendar observances, not a complete list. Participation, regional dates and days off vary. Dates mark the observance, not necessarily the full holiday break; confirm local announcements.';
  let usesCalendar = false;
  if (noResidentCalendar.has(code)) {
    note = 'There is no permanent resident community with a single national festival calendar here. Research teams and visitors observe their own traditions.';
  } else if (code === 'IO') {
    note = 'Chagossian cultural traditions continue in displaced communities. A single present-day national holiday calendar would not represent those communities accurately.';
  } else if (Object.hasOwn(calendars, code)) {
    usesCalendar = true;
    const hd = new Holidays(code, { languages: ['en'] });
    // The base library omits Canadian regional/general holidays, including Thanksgiving.
    if (code === 'CA') {
      hd.setHoliday('2nd monday in October', { name: 'Thanksgiving', type: 'observance' });
      hd.setHoliday('11-11', { name: 'Remembrance Day', type: 'observance' });
      hd.setHoliday('12-26', { name: 'Boxing Day', type: 'observance' });
    }
    // Christmas shares a date with Quaid-e-Azam Day; keep both identities visible.
    if (code === 'PK') hd.setHoliday('12-25', { name: 'Quaid-e-Azam Day / Christmas', type: 'public' });
    const grouped = new Map();
    for (const item of hd.getHolidays(year)) {
      if (!['public', 'observance', 'optional'].includes(item.type) || excludedNames.test(item.name)) continue;
      // Upstream EH has an inconsistent "May 20" rule on May 10; don't publish it.
      if (code === 'EH' && /May 20 Revolution/.test(item.name)) continue;
      const uncertain = lunarRule.test(item.rule);
      const name = item.name.replace(/\(substitute day\)/g, '(observed)');
      const groupKey = `${name}:${item.type}`;
      let event = grouped.get(groupKey);
      if (!event) {
        const source = code === 'US' && item.type === 'public' ? opm
          : code === 'CA' && ['Thanksgiving', 'Remembrance Day', 'Boxing Day'].includes(name) ? cra
            : code === 'PK' && year === 2026 && name.includes('Christmas') ? pakistan : providerSource;
        event = { name, dates: [], kind: item.type, dateNote: uncertain ? 'Date varies with the Islamic calendar and local moon sighting' : undefined, source };
        grouped.set(groupKey, event);
      }
      // Calculated Islamic dates can differ from announced local dates. No false precision.
      if (!uncertain) event.dates.push(item.date.slice(0, 10));
    }
    calendar = [...grouped.values()].map(event => ({ ...event, dates: [...new Set(event.dates)].sort() }));
    if (code === 'EH') note += ' This calendar describes Sahrawi observances; it does not describe every community or administration in the disputed territory.';
  }
  const sources = [
    ...highlights.map(event => event.source), ...calendar.map(event => event.source),
    ...(guideSources[code] ? [guideSources[code]] : []),
  ].filter(Boolean).filter((source, index, all) => all.findIndex(other => other.url === source.url) === index);
  const result = { year, highlights, calendar, note, sources, attribution: usesCalendar ? calendarAttribution : undefined };
  // Only current/recently requested country-year combinations need to remain warm.
  if (cache.size >= 500) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}
