import guideSources from './holiday-sources.mjs';

// Named annual observances where the calendar provider has no country coverage.
// These are cultural examples, not declarations of nationwide days off.
// Undated entries deliberately avoid guessing Gregorian dates for lunar events.
const annual = {
  AF: ['Eid al-Fitr', 'Eid al-Adha', 'Independence Day', 'Mawlid (Prophet’s birthday)'],
  BT: ['Losar (Bhutanese New Year)', 'Parinirvana of the Buddha', 'Guru Rinpoche’s birthday', 'Drukpa Tshezhi', 'Thimphu Tshechu', 'National Day'],
  FK: ['New Year’s Day', 'Good Friday', 'Liberation Day', 'Battle Day', 'Christmas Day'],
  FM: ['New Year’s Day', 'Micronesian Culture and Traditions Day', 'Constitution Day', 'Independence Day', 'Thanksgiving', 'Christmas Day'],
  IQ: ['New Year’s Day', 'Eid al-Fitr', 'Eid al-Adha', 'Islamic New Year', 'Ashura', 'National Day'],
  JO: ['New Year’s Day', 'Eid al-Fitr', 'Easter', 'Independence Day', 'Eid al-Adha', 'Christmas Day'],
  KG: ['New Year’s Day', 'Orthodox Christmas', 'Nowruz', 'Eid al-Fitr', 'Eid al-Adha', 'Independence Day'],
  KH: ['Khmer New Year', 'Meak Bochea', 'Visak Bochea', 'Royal Ploughing Ceremony', 'Pchum Ben', 'Water Festival (Bon Om Touk)', 'Independence Day'],
  KI: ['New Year’s Day', 'Good Friday', 'Easter Monday', 'Gospel Day', 'Independence Day', 'Christmas Day'],
  KP: ['New Year’s Day', 'Kim Jong Il’s birthday', 'Kim Il Sung’s birthday', 'Liberation Day', 'National Foundation Day', 'Party Foundation Day'],
  KW: ['New Year’s Day', 'National Day', 'Liberation Day', 'Eid al-Fitr', 'Eid al-Adha', 'Islamic New Year'],
  LA: ['New Year’s Day', 'Pi Mai (Lao New Year)', 'Buddha’s birthday', 'Labour Day', 'National Day'],
  LB: ['New Year’s Day', 'Armenian Christmas', 'St Maroun’s Day', 'Eid al-Fitr', 'Easter', 'Orthodox Easter', 'Eid al-Adha', 'Independence Day', 'Christmas Day'],
  MH: ['New Year’s Day', 'Nuclear Victims Remembrance Day', 'Constitution Day', 'Fisherman’s Day', 'Manit Day (Culture Day)', 'Kamolol Day (Thanksgiving)', 'Christmas Day'],
  MM: ['Independence Day', 'Thingyan', 'Myanmar New Year', 'Full Moon of Kason', 'Thadingyut', 'Tazaungdaing', 'Christmas Day'],
  MN: ['New Year’s Day', 'Tsagaan Sar', 'International Women’s Day', 'Mother and Children’s Day', 'Naadam', 'Independence Day'],
  MO: ['Chinese New Year', 'Qingming', 'Buddha’s birthday', 'Dragon Boat Festival', 'Mid-Autumn Festival', 'Chung Yeung Festival', 'Macao SAR Establishment Day', 'Christmas Day'],
  MP: ['New Year’s Day', 'Commonwealth Day', 'Covenant Day', 'US Independence Day', 'Citizenship Day', 'Thanksgiving', 'Christmas Day'],
  MV: ['Ramadan', 'Eid al-Fitr', 'Eid al-Adha', 'Independence Day', 'Day of Embracing Islam', 'Republic Day'],
  NP: ['Basant Panchami', 'Maha Shivaratri', 'Holi', 'Nepali New Year', 'Buddha Jayanti', 'Dashain', 'Constitution Day'],
  NR: ['New Year’s Day', 'Independence Day', 'Easter', 'Constitution Day', 'Angam Day', 'Christmas Day'],
  NU: ['New Year’s Day', 'Takai', 'Waitangi Day', 'Good Friday', 'Easter Monday', 'Christmas Day'],
  OM: ['Isra and Mi’raj', 'Eid al-Fitr', 'Eid al-Adha', 'Islamic New Year', 'Mawlid (Prophet’s birthday)', 'National Day'],
  PG: ['New Year’s Day', 'Good Friday', 'Easter Monday', 'Remembrance Day', 'Independence Day', 'Christmas Day'],
  PS: ['Eid al-Fitr', 'Eid al-Adha', 'Islamic New Year', 'Mawlid (Prophet’s birthday)', 'Independence Day', 'Christmas'],
  PW: ['New Year’s Day', 'Youth Day', 'Senior Citizens Day', 'Constitution Day', 'Independence Day', 'Thanksgiving', 'Christmas Day'],
  QA: ['Eid al-Fitr', 'Eid al-Adha', 'National Day'],
  SB: ['New Year’s Day', 'Good Friday', 'Easter Monday', 'Independence Day', 'National Thanksgiving Day'],
  SY: ['New Year’s Day', 'Eid al-Fitr', 'Easter', 'Orthodox Easter', 'Evacuation Day', 'Eid al-Adha', 'Christmas Day'],
  TJ: ['New Year’s Day', 'Nowruz', 'Eid al-Fitr', 'National Unity Day', 'Eid al-Adha', 'Independence Day'],
  TL: ['New Year’s Day', 'Good Friday', 'Restoration of Independence Day', 'All Saints’ Day', 'Santa Cruz Day', 'Christmas Day'],
  TM: ['New Year’s Day', 'Nowruz', 'Eid al-Fitr', 'Eid al-Adha', 'Independence Day', 'Neutrality Day'],
  TV: ['New Year’s Day', 'Good Friday', 'Easter Monday', 'Gospel Day', 'Tuvalu Days', 'Christmas Day'],
  UZ: ['New Year’s Day', 'Nowruz', 'Eid al-Fitr', 'Remembrance Day', 'Eid al-Adha', 'Independence Day'],
  WS: ['New Year’s Day', 'Good Friday', 'Easter Monday', 'Independence Day', 'White Sunday', 'Christmas Day'],
  YE: ['Eid al-Fitr', 'Eid al-Adha', 'Islamic New Year', 'Mawlid (Prophet’s birthday)', 'Unity Day', 'Independence Day'],
};

export const festivalHighlights = Object.fromEntries(Object.entries(annual).map(([code, names]) => [code,
  names.map(name => ({ name, timing: 'Annual observance · check local dates', source: guideSources[code] })),
]));

const add = (code, name, timing, title, url) => {
  (festivalHighlights[code] ||= []).push({ name, timing, source: { title, url } });
};
add('US', 'Mardi Gras', 'New Orleans and other Gulf Coast communities · February or March', 'New Orleans & Company — Mardi Gras', 'https://www.neworleans.com/events/holidays-seasonal/mardi-gras/');
add('IN', 'Holi', 'Spring · dates and local traditions vary', 'Incredible India — Holi', 'https://www.incredibleindia.gov.in/en/festivals-and-events/holi');
add('IN', 'Diwali / Deepavali', 'October or November · regional and community traditions vary', 'Incredible India — Diwali', 'https://www.incredibleindia.gov.in/en/festivals-and-events/diwali');
add('IN', 'Navratri and Durga Puja', 'Autumn · distinct regional traditions', 'Incredible India — Dussehra', 'https://www.incredibleindia.gov.in/en/festivals-and-events/dussehra');
add('IN', 'Dussehra', 'Following Navratri · dates vary each year', 'Incredible India — Dussehra', 'https://www.incredibleindia.gov.in/en/festivals-and-events/dussehra');
add('IN', 'Eid al-Fitr', 'End of Ramadan · local moon sighting', 'Incredible India — Festivals and events', 'https://www.incredibleindia.gov.in/en/festivals-and-events/republic-day');
add('NP', 'Tihar', 'October or November · festival of lights and family rituals', 'Nepal Tourism Board — Tihar', 'https://ntb.gov.np/en/tihar');
add('NP', 'Indra Jatra', 'Kathmandu Valley · dates vary', 'Nepal Tourism Board — Indra Jatra', 'https://ntb.gov.np/en/indra-jatra');
// Replace the broad guide with the direct cultural source for Dashain.
festivalHighlights.NP.find(event => event.name === 'Dashain').source = { title: 'Nepal Tourism Board — Dashain', url: 'https://ntb.gov.np/en/dashain' };
add('PN', 'Bounty Day', '23 January · Pitcairn Island', 'Pitcairn Islands Tourism — Bounty Day', 'https://www.visitpitcairn.pn/the-pitkern-blog/bounty-day-2024');
for (const name of ['New Year’s Day', 'Waitangi Day', 'Good Friday', 'Easter Monday', 'ANZAC Day', 'Tokehega Day', 'Christmas Day']) {
  add('TK', name, 'Annual observance · check local dates', 'Government of Tokelau — Culture', 'https://www.tokelau.org.nz/About+Us/Culture.html');
}
add('NF', 'Bounty Day', '8 June · Norfolk Island', 'Norfolk Island Tourism — Pitcairn culture', 'https://www.norfolkisland.com.au/things-to-do/arts-and-culture/pitcairn-culture/');
add('DE', 'Oktoberfest', 'Munich, Bavaria · September to early October', 'City of Munich — Official Oktoberfest', 'https://www.oktoberfest.de/en');
add('JP', 'Obon', 'Ancestor remembrance · usually mid-August; some communities observe it in July', 'Japan National Tourism Organization — Obon', 'https://www.japan.travel/de/de/story/obon-japan/');
add('JP', 'Aomori Nebuta Matsuri', 'Aomori · early August', 'Japan National Tourism Organization — August festivals', 'https://www.japan.travel/en/guide/august/');
add('BR', 'Festas Juninas', 'June · regional music, dance and community celebrations', 'Embratur / Visit Brasil — June parties', 'https://visitbrasil.com/en/festivity/june-parties/');
add('PE', 'Inti Raymi', 'Cusco · 24 June', 'PROMPERÚ — Inti Raymi', 'https://www.peru.travel/events/inti-raymi');
add('QA', 'National Sports Day', 'Second Tuesday in February', 'Visit Qatar — Official holidays', 'https://visitqatar.com/intl-en/plan-your-trip/travel-tips');
for (const name of ['New Year’s Day', 'Good Friday', 'Easter Monday', 'Christmas Day', 'Boxing Day']) {
  add('PN', name, 'Annual observance · check local dates', 'Q++ Studio — Pitcairn holiday calendar', 'https://www.qppstudio.net/public-holidays/pitcairn_islands.htm');
}
add('SB', 'Christmas Day', '25 December · Christian celebration', 'Office Holidays — Solomon Islands Christmas', 'https://www.officeholidays.com/holidays/solomon-islands/christmas-day');
add('NP', 'Christmas', '25 December · Christian communities', 'Time and Date — Christmas in Nepal', 'https://www.timeanddate.com/holidays/nepal/christmas-day');
