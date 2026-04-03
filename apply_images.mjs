// Apply image URLs to countryData files
// Reads image_urls.json, fixes known bad matches, and updates both data files

import fs from 'fs';

const imageData = JSON.parse(fs.readFileSync('image_urls.json', 'utf-8'));

// Manual overrides for known bad results from the script
const manualOverrides = {
  // Bad Wikipedia matches - use direct Wikimedia Commons URLs
  'brazil|Pelourinho Historic Center': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Largo_do_Pelourinho2.jpg/800px-Largo_do_Pelourinho2.jpg',
  'mexico|Cenotes of Yucatan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Cenote_Samul%C3%A1_-_Dzitnup_-_near_Valladolid_-_Yucat%C3%A1n_-_Mexico_-_02.jpg/800px-Cenote_Samul%C3%A1_-_Dzitnup_-_near_Valladolid_-_Yucat%C3%A1n_-_Mexico_-_02.jpg',
  'mexico|Guanajuato': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Guanajuato_city_view_2.jpg/800px-Guanajuato_city_view_2.jpg',
  'spain|La Sagrada Familia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Basilica_de_la_Sagrada_Familia_-_panoramio_%281%29.jpg/800px-Basilica_de_la_Sagrada_Familia_-_panoramio_%281%29.jpg',
  'vietnam|Ha Long Bay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Ha_Long_Bay%2C_Vietnam_%283526009737%29.jpg/800px-Ha_Long_Bay%2C_Vietnam_%283526009737%29.jpg',
  'portugal|Sintra Palaces': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Sintra_Portugal_Pal%C3%A1cio_da_Pena-01.jpg/800px-Sintra_Portugal_Pal%C3%A1cio_da_Pena-01.jpg',
  'portugal|Algarve Caves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Benagil_Cave%2C_Algarve%2C_Portugal_%2846110890781%29.jpg/800px-Benagil_Cave%2C_Algarve%2C_Portugal_%2846110890781%29.jpg',
  'indonesia|Borobudur': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Borobudur-Nothwest-view.jpg/800px-Borobudur-Nothwest-view.jpg',
  'indonesia|Raja Ampat Islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Raja_Ampat%2C_West_Papua_%2830881072006%29.jpg/800px-Raja_Ampat%2C_West_Papua_%2830881072006%29.jpg',
  'malaysia|George Town Heritage': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Ah_Quee_Street_art%2C_George_Town%2C_Penang.jpg/800px-Ah_Quee_Street_art%2C_George_Town%2C_Penang.jpg',
  'saudi arabia|Edge of the World': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Edge_of_the_World%2C_Saudi_Arabia%2C_2011.jpg/800px-Edge_of_the_World%2C_Saudi_Arabia%2C_2011.jpg',
  'colombia|Cartagena Old Town': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Cartagena_de_Indias_desde_el_satisfactorio_cerro_de_La_Popa.jpg/800px-Cartagena_de_Indias_desde_el_satisfactorio_cerro_de_La_Popa.jpg',
  'philippines|Rice Terraces of the Philippine Cordilleras': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Banaue_Rice_Terraces%2C_Ifugao.jpg/800px-Banaue_Rice_Terraces%2C_Ifugao.jpg',
  'new zealand|Queenstown': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Queenstown_From_Bobs_Peak.jpg/800px-Queenstown_From_Bobs_Peak.jpg',
  'new zealand|Waitomo Glowworm Caves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Waitomo_Glowworm_Caves.jpg/800px-Waitomo_Glowworm_Caves.jpg',
  'ireland|Ring of Kerry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Ring_of_Kerry_view_over_Derrynane.jpg/800px-Ring_of_Kerry_view_over_Derrynane.jpg',
  'sweden|ICEHOTEL': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/ICEHOTEL-Jukkasj%C3%A4rvi-2012-01-02.jpg/800px-ICEHOTEL-Jukkasj%C3%A4rvi-2012-01-02.jpg',
  'czech republic|Prague Castle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Prague_Castle_from_river_Moldau.jpg/800px-Prague_Castle_from_river_Moldau.jpg',
  'czechia|Prague Castle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Prague_Castle_from_river_Moldau.jpg/800px-Prague_Castle_from_river_Moldau.jpg',
  'israel|Dead Sea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Dead_Sea_by_David_Shankbone.jpg/800px-Dead_Sea_by_David_Shankbone.jpg',
  'israel|Bahá\'í Gardens': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Bahá%27í_gardens_by_David_Shankbone.jpg/800px-Bahá%27í_gardens_by_David_Shankbone.jpg',
  'jordan|Dead Sea (Jordan)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Dead_Sea_by_David_Shankbone.jpg/800px-Dead_Sea_by_David_Shankbone.jpg',
  'jordan|Aqaba Coral Reef': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Coral_reef_at_palmyra.jpg/800px-Coral_reef_at_palmyra.jpg',
  'jordan|Jerash Ruins': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Jerash_-_Pair_of_colonnades.jpg/800px-Jerash_-_Pair_of_colonnades.jpg',
  'nepal|Chitwan National Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Chitwan_national_park_Rhinos.jpg/960px-Chitwan_national_park_Rhinos.jpg',
  'nepal|Pashupatinath Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Pashupatinath_Temple%2C_Kathmandu%2C_Nepal_%2839076%29.jpg/960px-Pashupatinath_Temple%2C_Kathmandu%2C_Nepal_%2839076%29.jpg',
  // Fix attractions that matched wrong pages
  'japan|Senso-ji Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Senso-ji_2012.jpg/800px-Senso-ji_2012.jpg',
  'italy|Venice Canals': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Canal_Grande_Chiesa_della_Salute_e_Dogana_dal_ponte_dell_Accademia.jpg/800px-Canal_Grande_Chiesa_della_Salute_e_Dogana_dal_ponte_dell_Accademia.jpg',
  'hungary|Buda Castle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Budapest_Castle_from_across_the_Danube.jpg/800px-Budapest_Castle_from_across_the_Danube.jpg',
  'russia|St. Basil\'s Cathedral': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Москва._Собор_Василия_Блаженного._02.jpg/800px-Москва._Собор_Василия_Блаженного._02.jpg',
  'poland|Old Town Market Square': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Rynek_Starego_Miasta_w_Warszawie_2019.jpg/800px-Rynek_Starego_Miasta_w_Warszawie_2019.jpg',
  'cuba|Trinidad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Trinidad_%28Kuba%29_02.jpg/800px-Trinidad_%28Kuba%29_02.jpg',
  'austria|Salzburg Old Town': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Salzburg_view_from_M%C3%B6nchsberg_04.jpg/800px-Salzburg_view_from_M%C3%B6nchsberg_04.jpg',
  'switzerland|Matterhorn': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Matterhorn_from_Domhütte_-_2.jpg/800px-Matterhorn_from_Domhütte_-_2.jpg',
  'egypt|Pyramids of Giza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/800px-Kheops-Pyramid.jpg',
};

// Build a mapping from country|name → imageUrl
const urlMap = {};
for (const [country, attractions] of Object.entries(imageData)) {
  for (const attr of attractions) {
    const key = `${country}|${attr.name}`;
    // Use manual override if available, otherwise use script result
    if (manualOverrides[key]) {
      urlMap[key] = manualOverrides[key];
    } else if (attr.imageUrl && !attr.imageUrl.includes('.pdf') && !attr.imageUrl.includes('.djvu')) {
      urlMap[key] = attr.imageUrl;
    }
  }
}

// Now update the source files
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let count = 0;
  
  // Find all attraction objects and add/update imageUrl
  // Match lines like: { name: "xxx", city: "yyy", ..., imageSearchQuery: "zzz" },
  // or lines that already have imageUrl
  
  // First, find which country each attraction belongs to
  const countryRegex = /^\s*(?:'([^']+)'|"([^"]+)"|(\w[\w\s]*)):\s*\[/gm;
  const attrRegex = /\{\s*name:\s*"([^"]+)".*?imageSearchQuery:\s*"([^"]+)"(?:,\s*imageUrl:\s*"[^"]*")?\s*\}/g;
  
  // Parse the file to find country context for each attraction
  const lines = content.split('\n');
  let currentCountry = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for country key
    const countryMatch = line.match(/^\s*(?:'([^']+)'|"([^"]+)"|([a-z][\w\s]*?))\s*:\s*\[/);
    if (countryMatch) {
      currentCountry = countryMatch[1] || countryMatch[2] || countryMatch[3];
      if (currentCountry) currentCountry = currentCountry.trim();
    }
    
    // Check for attraction with imageSearchQuery
    const nameMatch = line.match(/name:\s*"([^"]+)"/);
    const isqMatch = line.match(/imageSearchQuery:\s*"[^"]+"/);
    
    if (nameMatch && isqMatch && currentCountry) {
      const attrName = nameMatch[1];
      const key = `${currentCountry}|${attrName}`;
      const url = urlMap[key];
      
      if (url) {
        // Check if line already has imageUrl
        if (line.includes('imageUrl:')) {
          // Replace existing imageUrl
          const newLine = line.replace(/imageUrl:\s*"[^"]*"/, `imageUrl: "${url}"`);
          if (newLine !== line) {
            lines[i] = newLine;
            count++;
          }
        } else {
          // Add imageUrl after imageSearchQuery
          const newLine = line.replace(
            /(imageSearchQuery:\s*"[^"]+")(\s*\})/,
            `$1, imageUrl: "${url}"$2`
          );
          if (newLine !== line) {
            lines[i] = newLine;
            count++;
          }
        }
      }
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log(`Updated ${count} attractions in ${filePath}`);
}

updateFile('server/countryData.mjs');
updateFile('server/countryDataExtra.mjs');

console.log('\nDone! All attraction image URLs have been set.');
