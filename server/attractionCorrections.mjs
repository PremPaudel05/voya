// Specific place names avoid pairing a broad category with an unrelated image.
// Each replacement is resolved and country-checked by the same photo pipeline.
const corrections = {
  MX: { 'Cenotes of Yucatan': { name: 'Ik Kil', famousFor: 'A cenote near Chichen Itza, with steep limestone walls and a natural pool', interestingFact: '' } },
  TH: { 'Chiang Mai Old City': { name: 'Wat Phra Singh', famousFor: 'A Buddhist temple in Chiang Mai’s historic old city', interestingFact: '' } },
  IT: { 'Venice Canals': { name: 'Grand Canal (Venice)', famousFor: 'Venice’s main canal, lined with historic palaces and crossed by the Rialto Bridge', interestingFact: '' } },
  PT: { 'Sintra Palaces': { name: 'Pena Palace', famousFor: 'A colourful palace on a hill above Sintra', interestingFact: '' } },
  ID: { 'Bali Temples': { name: 'Tanah Lot', famousFor: 'A sea temple on a rock formation off Bali’s coast', interestingFact: '' } },
  VN: { 'Phong Nha Caves': { name: 'Phong Nha Cave', famousFor: 'A limestone cave with an underground river in Phong Nha-Kẻ Bàng National Park', interestingFact: '' } },
  NO: { 'Northern Lights in Tromsø': { name: 'Tromsø', famousFor: 'An Arctic city surrounded by mountains and waterways', interestingFact: '' } },
  IE: { "Giant's Causeway": { name: 'Rock of Cashel', city: 'County Tipperary', famousFor: 'A historic hilltop complex of medieval ecclesiastical buildings', interestingFact: '' } },
  JO: { 'Aqaba Coral Reef': { name: 'Aqaba', famousFor: 'Jordan’s coastal city on the Red Sea', interestingFact: '' } },
};
export function correctAttraction(attraction, code) {
  const correction = corrections[code]?.[attraction.name];
  return correction ? { ...attraction, ...correction, imageUrl: undefined, imageSearchQuery: `${correction.name} ${code}` } : attraction;
}

// Replace generic categories with identifiable places; add missing country entries.
export const additionalAttractions = {
  BB: [
    { name: 'Andromeda Botanic Gardens', city: 'Saint Joseph', famousFor: 'A botanical garden on the island’s east coast' },
    { name: 'Carlisle Bay (Barbados)', city: 'Bridgetown', famousFor: 'A bay along the southwest coast of Barbados' },
  ],
  MV: [
    { name: 'Malé Friday Mosque', city: 'Malé', famousFor: 'A historic mosque in the Maldivian capital' },
    { name: 'National Museum (Maldives)', city: 'Malé', famousFor: 'A museum of Maldivian history and cultural heritage' },
    { name: 'Hulhumalé', city: 'North Malé Atoll', famousFor: 'An island connected to the capital region' },
  ],
  SO: [
    { name: 'Mogadishu Cathedral', city: 'Mogadishu', famousFor: 'The remains of a historic cathedral in the capital' },
    { name: 'Liido Beach', city: 'Mogadishu', famousFor: 'A beach along the city’s Indian Ocean coastline' },
  ],
  PS: [
    { name: 'Church of the Nativity', city: 'Bethlehem', famousFor: 'A historic Christian pilgrimage site' },
    { name: "Hisham's Palace", city: 'Jericho', famousFor: 'An archaeological site known for its mosaic floors' },
  ],
  XK: [
    { name: 'Prizren Fortress', city: 'Prizren', famousFor: 'A hilltop fortress overlooking the historic city' },
    { name: 'Gračanica Monastery', city: 'Gračanica', famousFor: 'A medieval monastery known for its architecture and frescoes' },
  ],
};
