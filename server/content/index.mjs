import { resolveCountryCode } from '../countryIdentity.mjs';
import asia from './asia.mjs';
import europe from './europe.mjs';
import africa from './africa.mjs';
import americas from './americas.mjs';
import oceania from './oceania.mjs';
import territories from './territories.mjs';
import polar from './polar.mjs';
import sources from './sources.mjs';

export const contentVersion = '2026-09-06';
export const countryContent = Object.fromEntries(
  [asia, europe, africa, americas, oceania, territories, polar]
    .flatMap(region => Object.entries(region))
    .map(([code, content]) => [code, { ...content, contentSources: sources[code], contentVersion }]),
);

// ISO identity keeps aliases and alternate official names on the same profile.
// Unknown names never receive invented food or culture entries.
export function getCountryContent(nameOrCode) {
  const input = String(nameOrCode || '').trim();
  const code = Object.hasOwn(countryContent, input.toUpperCase())
    ? input.toUpperCase() : resolveCountryCode(input);
  return Object.hasOwn(countryContent, code) ? countryContent[code] : null;
}
