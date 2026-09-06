import { profile as p } from './schema.mjs';

// These places must not inherit invented national dishes or folk traditions.
const stationContext = (foodsNote, traditions, socialNorms, etiquetteTips, religionOverview) => ({
  foods: [], foodsNote,
  culture: { traditions, socialNorms, etiquetteTips, religionOverview,
    note: 'Human activity here is shaped by expeditions, research, and conservation rather than a permanent national community.' },
});

export default {
  AQ: stationContext(
    'Antarctica has no Indigenous population or permanent national cuisine. Research-station meals reflect the cooks, supplies, and communities taking part in each expedition.',
    ['Midwinter celebrations at research stations often include a shared meal and messages exchanged with other stations.'],
    ['Station life depends on shared spaces and cooperation among international teams.'],
    ['Ask before entering working or residential areas at a research station.'],
    'Beliefs reflect individual expedition members; Antarctica has no single local religion.'),
  BV: stationContext(
    'Bouvet Island is uninhabited. There is no resident food culture to describe as a national cuisine.',
    [], ['Human visits are associated with expeditions and scientific observation.'],
    ['Treat expedition equipment and historical traces as objects to leave undisturbed.'],
    'There is no resident religious community.'),
  GS: stationContext(
    'South Georgia and the South Sandwich Islands have no permanent resident national community. Meals for research and visiting teams depend on their supplies and cooks.',
    ['Grytviken’s museum preserves maritime, whaling, and exploration history.'],
    ['Research and heritage work shape the small, temporary human presence.'],
    ['Treat former settlement sites, cemeteries, and working stations with care.'],
    'Grytviken’s church is a historic site; temporary residents have varied personal beliefs.'),
  HM: stationContext(
    'Heard Island and McDonald Islands are uninhabited. Expedition provisions are not a local national cuisine.',
    [], ['Scientific field visits account for the islands’ limited human activity.'],
    ['Leave historic expedition remains undisturbed.'],
    'There is no resident religious community.'),
  TF: stationContext(
    'The French Southern and Antarctic Lands have research and other temporary stations, rather than a permanent civilian food culture. Station meals should not be presented as Indigenous dishes.',
    ['Midwinter gatherings are part of life at subantarctic research stations.'],
    ['Residents of stations work and live within small rotating teams.'],
    ['Respect shared station spaces and ask before entering work areas.'],
    'Beliefs reflect individual station members rather than a single territorial religion.'),
  UM: stationContext(
    'The United States Minor Outlying Islands group several separate islands, most without residents. There is no single shared island cuisine to list.',
    [], ['The islands have distinct Pacific or Caribbean histories; they should not be treated as one cultural community.'],
    ['Respect the heritage and conservation context of the particular island being discussed.'],
    'There is no single resident religious community across this group of islands.'),
  SJ: {
    ...p(`Reindeer dishes|Reindeer prepared in different restaurant styles.|Part of Longyearbyen’s Arctic restaurant scene
Pizza|Flatbread baked with savoury toppings.|International food served in Svalbard
Sushi|Seasoned rice with seafood or other toppings.|International food served in Svalbard`,
      ['Solfestuka marks the return of sunlight to Longyearbyen after the polar night.', 'Mining heritage and international research have shaped Svalbard’s settlements.'],
      ['Longyearbyen is an international community, with Norwegian and many other languages spoken.', 'Jan Mayen has a rotating station team rather than the same settlement life as Svalbard.'],
      ['Remove outdoor footwear where indoor signs or your host request it.', 'Ask before entering historic mining structures or working research areas.'],
      'Residents have varied beliefs; Svalbard Church also serves as a community gathering place.'),
    foodsNote: 'Svalbard’s restaurants serve Arctic ingredients alongside international dishes. These examples are foods found there, rather than a separate national cuisine.',
  },
};
