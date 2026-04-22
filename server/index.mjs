import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getCode } from 'country-list';
import {
  knownAttractionsData,
  knownPhrasesData,
  knownPricesData,
  knownBestTimeToVisitData,
  knownFunFactsData,
} from './countryData.mjs';
import fs from 'fs';
import path from 'path';
import { extraCultureProfiles, extraFoodData, extraMapCategoryData } from './indexExtra.mjs';

// ── Groq AI enrichment ───────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const geminiCache = new Map(); // session cache to avoid duplicate AI calls

async function geminiEnrich(countryName, capital, currencyCode) {
  const key = countryName.toLowerCase();
  if (geminiCache.has(key)) return geminiCache.get(key);

  if (!GROQ_API_KEY) return null;

  const prompt = `You are a travel data API. Return ONLY a valid JSON object (no markdown, no explanation) for the country "${countryName}" with this exact structure:
{
  "foods": [
    { "name": "...", "description": "...", "famousFor": "..." }
  ],
  "attractions": [
    { "name": "...", "city": "...", "famousFor": "...", "interestingFact": "...", "imageSearchQuery": "..." }
  ],
  "phrases": [
    { "english": "...", "local": "...", "phonetic": "..." }
  ],
  "funFacts": ["...", "...", "...", "...", "..."],
  "bestTimeToVisit": {
    "bestMonths": "...",
    "rainySeason": "...",
    "cheapestSeason": "...",
    "majorFestivals": ["...", "...", "..."]
  },
  "culture": {
    "traditions": ["...", "...", "...", "...", "..."],
    "socialNorms": ["...", "...", "...", "...", "..."],
    "religionOverview": "...",
    "etiquetteTips": ["...", "...", "...", "...", "..."]
  },
  "mapCategories": {
    "bestBeaches": ["...", "...", "..."],
    "bestFoodAreas": ["...", "...", "..."],
    "nightlifeZones": ["...", "...", "..."],
    "instagrammableSpots": ["...", "...", "...", "...", "..."],
    "areasToAvoid": ["...", "..."]
  },
  "prices": {
    "hotel": "...",
    "meal": "...",
    "streetFood": "...",
    "coffee": "...",
    "transport": "...",
    "taxi": "..."
  }
}
Rules:
- foods: exactly 5 real traditional dishes
- attractions: exactly 5 real famous attractions with real city names
- phrases: exactly 10 common travel phrases in the country's primary language
- funFacts: exactly 5 surprising, specific, true facts
- prices: use USD with realistic ranges for ${countryName}
- mapCategories: use real place names in ${countryName}, skip arrays if not applicable (empty array)
- Be specific and accurate. Capital is ${capital}, currency is ${currencyCode}.`;

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) {
      console.warn('Groq API error:', resp.status, await resp.text());
      return null;
    }
    const json = await resp.json();
    const raw = json?.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    geminiCache.set(key, parsed);
    return parsed;
  } catch (e) {
    console.warn('Groq enrichment failed for', countryName, e?.message || e);
    return null;
  }
}
// ────────────────────────────────────────────────────────────────────────────

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for Vite dev
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// CORS - restrict in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc) in dev
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(bodyParser.json({ limit: '1mb' }));

// Health check endpoint for deployment diagnostics
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Server is up' });
});

// Image proxy: fetches real images from Wikipedia for attraction names
const imageCache = new Map();

const BAD_IMAGE_PATTERNS = /logo|badge|seal|emblem|flag|icon|coat.of.arms|insignia|symbol|crest|\.svg/i;

async function fetchWikiImage(searchQuery, minWidth = 300) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=5&prop=pageimages&piprop=thumbnail|name&pithumbsize=600&format=json&origin=*`;
  const resp = await fetch(url);
  const data = await resp.json();
  const pages = data?.query?.pages;
  if (pages) {
    const sorted = Object.values(pages).sort((a, b) => (a.index || 0) - (b.index || 0));
    const queryLower = searchQuery.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Score each page by how well its title matches the query
    const validPages = sorted.filter(page => {
      const thumb = page?.thumbnail;
      if (!thumb?.source) return false;
      if (BAD_IMAGE_PATTERNS.test(thumb.source)) return false;
      return thumb.width >= minWidth && thumb.height >= 150;
    });

    if (validPages.length > 0) {
      // Score: count how many query words appear in the title
      const scored = validPages.map(page => {
        const titleLower = (page.title || '').toLowerCase();
        const titleWords = titleLower.split(/\s+/);
        let score = 0;
        for (const w of queryWords) {
          if (titleLower.includes(w)) score++;
        }
        // Bonus for exact title match
        if (titleLower === queryLower) score += 10;
        // Bonus if title is a substring of query or vice versa
        if (queryLower.includes(titleLower) && titleLower.length > 5) score += 2;
        if (titleLower.includes(queryLower)) score += 3;
        return { page, score };
      });

      // Sort by score desc, then by original search rank
      scored.sort((a, b) => b.score - a.score);

      // Only use scored match if it has a reasonable score
      if (scored[0].score >= 2) {
        return scored[0].page.thumbnail.source;
      }

      // Fallback to first valid result by search rank
      return validPages[0].thumbnail.source;
    }
  }
  return null;
}

app.get('/api/image', async (req, res) => {
  const query = String(req.query.q || '').trim().replace(/[<>{}]/g, '');
  if (!query) return res.status(400).send('Missing q parameter');
  if (query.length > 200) return res.status(400).send('Invalid query');

  if (imageCache.has(query)) {
    return res.redirect(imageCache.get(query));
  }

  try {
    let imageUrl = await fetchWikiImage(query);

    if (!imageUrl) {
      imageUrl = await fetchWikiImage(query + ' landmark');
    }
    if (!imageUrl) {
      imageUrl = await fetchWikiImage(query + ' tourist attraction');
    }

    if (imageUrl) {
      imageCache.set(query, imageUrl);
      return res.redirect(imageUrl);
    }

    const fallback = `https://picsum.photos/seed/${encodeURIComponent(query)}/400/300`;
    imageCache.set(query, fallback);
    return res.redirect(fallback);
  } catch {
    return res.redirect(`https://picsum.photos/seed/${encodeURIComponent(query)}/400/300`);
  }
});

function codeToFlagEmoji(code) {
  if (!code || code.length !== 2) return '';
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const knownCurrencyExchangeRates = {
  CNY: 7.2,
  INR: 82.0,
  NPR: 149.0,
  JPY: 150.0,
  KRW: 130.0,
  EUR: 0.91,
  GBP: 0.79,
  AUD: 1.5,
  CAD: 1.35,
  CHF: 0.91,
  MXN: 17.7,
  BRL: 5.2,
};

const knownGeographyData = {
  afghanistan: {
    climate: 'Arid and semi-arid continental climate with cold winters and hot summers. Winters are severe in the mountainous regions.',
    landscape: 'Mountainous terrain dominated by the Hindu Kush range, with plateaus, valleys, and deserts.',
    majorCities: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz'],
    naturalLandmarks: ['Hindu Kush Mountains', 'Panjsher Valley', 'Band-e Amir Lakes', 'Bamiyan Valley', 'Wakhan Corridor'],
  },
  albania: {
    climate: 'Mediterranean on the coast, continental inland with cold winters and warm summers.',
    landscape: 'Coastal plains along the Adriatic Sea, with mountains and valleys inland.',
    majorCities: ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Fier', 'Elbasan'],
    naturalLandmarks: ['Accursed Mountains', 'Lake Ohrid', 'Butrint', 'Dajti Mountain', 'Albanian Riviera'],
  },
  algeria: {
    climate: 'Mostly arid Sahara Desert climate. Temperate Mediterranean on the coast, hot and dry inland.',
    landscape: 'Dominated by the Sahara Desert, with the Atlas Mountains in the north and a narrow Mediterranean coastal strip.',
    majorCities: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Tlemcen'],
    naturalLandmarks: ['Sahara Desert', 'Atlas Mountains', 'Tassili n\'Ajjer', 'Great Sand Sea', 'Hoggar Mountains'],
  },
  andorra: {
    climate: 'Temperate mountain climate with cold winters and mild summers.',
    landscape: 'Entirely mountainous, nestled in the Pyrenees between France and Spain.',
    majorCities: ['Andorra la Vella', 'Escaldes-Engordany', 'Encamp', 'Sant Julià de Lòria'],
    naturalLandmarks: ['Pyrenees Mountains', 'Pic de Casamanya', 'Estany de Juclar', 'Sorteny Valley'],
  },
  angola: {
    climate: 'Tropical in the north, semi-arid inland and in the south with strong variations.',
    landscape: 'Coastal plains, central plateau, and northeastern rainforest. Diverse ecosystems including savannas.',
    majorCities: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Malanje'],
    naturalLandmarks: ['Kalandula Falls', 'Okavango Delta', 'Namib Desert', 'Iona National Park', 'Mount Moco'],
  },
  'antigua and barbuda': {
    climate: 'Tropical marine climate, warm and humid with a dry season.',
    landscape: 'Island nation with volcanic peaks, coral reefs, and tropical beaches.',
    majorCities: ['Saint John\'s', 'Codrington'],
    naturalLandmarks: ['Shipwreck Beach', 'Half Moon Bay', 'Devil\'s Bridge', 'Carlisle Bay Shipwrecks'],
  },
  argentina: {
    climate: 'Subtropical in the north, temperate in central regions, subpolar in Patagonia.',
    landscape: 'Pampas grasslands in the east, Andes mountains in the west, Patagonian steppe and glaciers in the south.',
    majorCities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán'],
    naturalLandmarks: ['Iguazu Falls', 'Perito Moreno Glacier', 'Mount Aconcagua', 'Quebrada de Humahuaca', 'Bariloche Lakes'],
  },
  armenia: {
    climate: 'Continental with cold winters and warm, dry summers.',
    landscape: 'Mountainous terrain with the Armenian Highlands dominating, featuring volcanic peaks and deep valleys.',
    majorCities: ['Yerevan', 'Gyumri', 'Vanadzor', 'Armavir', 'Ashdarak'],
    naturalLandmarks: ['Mount Ararat', 'Sevan Lake', 'Geghard Monastery', 'Garni Temple', 'Khor Virap'],
  },
  australia: {
    climate: 'Varies from tropical in the north to temperate in the south, arid in the interior.',
    landscape: 'Vast interior deserts, tropical rainforests in the north, temperate forests in the southeast, dramatic coastlines.',
    majorCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast'],
    naturalLandmarks: ['Great Barrier Reef', 'Uluru (Ayers Rock)', 'Sydney Opera House', 'Great Ocean Road', 'Blue Mountains'],
  },
  austria: {
    climate: 'Temperate continental climate with cold winters and warm summers.',
    landscape: 'Dominated by the Alps in the south and west, with the Danube River running through the east.',
    majorCities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt'],
    naturalLandmarks: ['Austrian Alps', 'Hallstatt', 'Danube Valley', 'Schönbrunn Palace', 'Neuschwanstein Castle area'],
  },
  azerbaijan: {
    climate: 'Continental with dry, hot summers and cold winters.',
    landscape: 'Mountainous regions including the Caucasus, with intermountain valleys and lowlands.',
    majorCities: ['Baku', 'Ganja', 'Sumgait', 'Quba', 'Lahij', 'Shaki'],
    naturalLandmarks: ['Caucasus Mountains', 'Caspian Sea coast', 'Mud Volcanoes', 'Absheron Peninsula', 'Shaki Khan Palace'],
  },
  bahamas: {
    climate: 'Tropical marine climate with warm waters and hurricane season June-November.',
    landscape: 'Archipelago of over 700 islands with sandy beaches, coral reefs, and clear turquoise waters.',
    majorCities: ['Nassau', 'Freeport', 'Marsh Harbour', 'Cooktop'],
    naturalLandmarks: ['Swimming Pigs Beach', 'Thunderball Grotto', 'Blue Holes', 'Coral Gardens', 'Exuma Cays'],
  },
  bahrain: {
    climate: 'Hot desert climate with very hot summers and mild winters. Humid due to proximity to Persian Gulf.',
    landscape: 'Small island nation with sandy desert and rocky coastline. Salt marshes and limited vegetation.',
    majorCities: ['Manama', 'Muharraq', 'Riffa', 'Hamad Town'],
    naturalLandmarks: ['Al Areen Wildlife Sanctuary', 'Barbar Temple', 'Al Fateh Grand Mosque', 'Tree of Life', 'Hawar Islands'],
  },
  bangladesh: {
    climate: 'Tropical monsoon climate with hot, humid summers and mild winters.',
    landscape: 'Mostly low-lying fertile plains of the Ganges Delta with some hilly regions in the southeast.',
    majorCities: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal'],
    naturalLandmarks: ['Sundarbans Mangrove Forest', 'Cox\'s Bazar Beach', 'Sylhet Tea Gardens', 'Chittagong Hill Tracts', 'Saint Martin\'s Island'],
  },
  barbados: {
    climate: 'Tropical marine climate, warm year-round with a dry season.',
    landscape: 'Flat island with some hilly terrain, surrounded by coral reefs and sandy beaches.',
    majorCities: ['Bridgetown', 'Speightstown', 'Oistins'],
    naturalLandmarks: ['Bridgetown Historic Core', 'Harrison\'s Cave', 'Bathsheba Beach', 'Chalk Cliffs', 'Dragon Cay'],
  },
  belarus: {
    climate: 'Continental with cold winters and warm summers.',
    landscape: 'Mostly flat plains with extensive forests and thousands of lakes.',
    majorCities: ['Minsk', 'Brest', 'Vitebsk', 'Gomel', 'Mogilev', 'Grodno'],
    naturalLandmarks: ['Pripyat Marshes', 'Braslav Lakes', 'Bialowieza Forest', 'Niasvizh Castle', 'Mir Castle Complex'],
  },
  belgium: {
    climate: 'Temperate maritime climate with mild winters and cool summers.',
    landscape: 'Coastal plains in the north, rolling hills in the south, divided by rivers and canals.',
    majorCities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges'],
    naturalLandmarks: ['Bruges Medieval City', 'Antwerp Cathedral', 'Atomium (Brussels)', 'Meuse River Valley', 'Ardennes Forest'],
  },
  belize: {
    climate: 'Tropical, with hot and humid conditions. Hurricane season June-November.',
    landscape: 'Coastal plains and swamps with mountains inland, covered with tropical rainforests.',
    majorCities: ['Belize City', 'San Ignacio', 'Orange Walk', 'Dangriga', 'Corozal'],
    naturalLandmarks: ['Great Blue Hole', 'Barrier Reef', 'Caracol Maya Ruins', 'Cockscomb Basin', 'Half Moon Caye'],
  },
  benin: {
    climate: 'Tropical with wet and dry seasons. Hot and humid year-round.',
    landscape: 'Coastal plains, savannas, and forests inland.',
    majorCities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Kandi', 'Bohicon'],
    naturalLandmarks: ['W National Park', 'Pendjari National Park', 'Lake Nokoué', 'Royal Palaces of Abomey', 'Djougou'],
  },
  bhutan: {
    climate: 'Varies from subtropical in the south to alpine in the high mountains.',
    landscape: 'Mountainous terrain covered with forests, with deep valleys and high peaks.',
    majorCities: ['Thimphu', 'Paro', 'Punakha', 'Wangdue', 'Trongsa'],
    naturalLandmarks: ['Tiger\'s Nest Monastery', 'Phobjikha Valley', 'Taktshang Goemba', 'Drukgyel Dzong', 'Punakha Dzong'],
  },
  bolivia: {
    climate: 'Tropical in the Amazon lowlands, cold in the Andes highlands, arid in the southwest.',
    landscape: 'Andes mountains dominating west, tropical rainforest in the northeast, salt flats and desert in the southwest.',
    majorCities: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Potosí', 'Sucre'],
    naturalLandmarks: ['Salar de Uyuni (Salt Flats)', 'Lake Titicaca', 'Death Road', 'Yungas Cloud Forest', 'Toro Toro Canyon'],
  },
  'bosnia and herzegovina': {
    climate: 'Mediterranean on the coast, continental inland with cold winters.',
    landscape: 'Mountainous Balkans with river valleys, forests, and a narrow Mediterranean coast.',
    majorCities: ['Sarajevo', 'Tuzla', 'Zenica', 'Prijedor', 'Banja Luka', 'Mostar'],
    naturalLandmarks: ['Stari Most (Mostar Bridge)', 'Kravice Waterfall', 'Plitvice Lakes', 'Bjelašnica Mountain', 'Neretva River Delta'],
  },
  botswana: {
    climate: 'Semi-arid with hot summers and mild winters.',
    landscape: 'Mostly the Kalahari Desert with the Okavango Delta in the north providing water and wildlife.',
    majorCities: ['Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Selibe-Phikwe', 'Kasane'],
    naturalLandmarks: ['Okavango Delta', 'Kalahari Desert', 'Makgadikgadi Pans', 'Chobe National Park', 'Moremi Game Reserve'],
  },
  brazil: {
    climate: 'Tropical and subtropical. Amazon region hot and humid; southern regions more seasonal.',
    landscape: 'Amazon Rainforest in the north, Central Plateau, Atlantic coastal strip, and varied biomes.',
    majorCities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte'],
    naturalLandmarks: ['Amazon Rainforest', 'Iguazu Falls', 'Christ the Redeemer', 'Copacabana Beach', 'Pantanal Wetlands'],
  },
  brunei: {
    climate: 'Tropical rainforest climate, hot and humid year-round with heavy rainfall.',
    landscape: 'Covered mostly in rainforest with coastal plains and river valleys.',
    majorCities: ['Bandar Seri Begawan', 'Kuala Belait', 'Seria'],
    naturalLandmarks: ['Jame\'asyikin Mosque', 'Malay Technology Museum', 'Brunei Museum', 'Pulau Selirong Firefly Park', 'Sungai Liang'],
  },
  bulgaria: {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Mountainous Balkans, river valleys, and Black Sea coast.',
    majorCities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora'],
    naturalLandmarks: ['Alexander Nevsky Cathedral', 'Black Sea Coast', 'Pirin National Park', 'Rila Monastery', 'Bansko Ski Resort'],
  },
  'burkina faso': {
    climate: 'Tropical savanna transitioning to desert in the north.',
    landscape: 'Mostly savanna plains with scattered trees and rocky outcrops.',
    majorCities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora'],
    naturalLandmarks: ['W National Park', 'Arli National Park', 'Cascades de Karfiguela', 'National Museum', 'Lake Bazega'],
  },
  burundi: {
    climate: 'Tropical highland climate with yearround mild temperatures due to elevation.',
    landscape: 'Mountainous terrain with deep valleys and Lake Tanganyika along the border.',
    majorCities: ['Bujumbura', 'Gitega', 'Ngozi', 'Muyinga', 'Ruyigi'],
    naturalLandmarks: ['Lake Tanganyika', 'Kibira National Park', 'Rusizi National Park', 'Gishwati-Mukura', 'Drummers Monument'],
  },
  cambodia: {
    climate: 'Tropical monsoon climate with hot and humid conditions.',
    landscape: 'Central plains containing Tonlé Sap Lake, with mountains in the north and east.',
    majorCities: ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Sihanoukville'],
    naturalLandmarks: ['Angkor Wat', 'Tonlé Sap Lake', 'Koh Rong Island', 'Silver Palace', 'Royal Palace of Cambodia'],
  },
  cameroon: {
    climate: 'Tropical in the south, semi-arid in the north with distinct wet and dry seasons.',
    landscape: 'Coastal plains, plateaus, and mountains with dense tropical forests.',
    majorCities: ['Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam', 'Kribi'],
    naturalLandmarks: ['Mount Cameroon', 'Waza National Park', 'Ring Road', 'Ekom Waterfall', 'Lake Chad'],
  },
  canada: {
    climate: 'Ranges from arctic in the north to temperate in the south; long cold winters.',
    landscape: 'Rocky Mountains in the west, Canadian Shield forests, Great Lakes in the center, Arctic archipelago.',
    majorCities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa'],
    naturalLandmarks: ['Niagara Falls', 'Banff National Park', 'Rocky Mountains', 'Jasper National Park', 'CN Tower'],
  },
  'cape verde': {
    climate: 'Tropical desert with hot, dry conditions and trade winds.',
    landscape: 'Archipelago of volcanic islands with black sand beaches and mountainous terrain.',
    majorCities: ['Praia', 'Mindelo', 'Santa Maria'],
    naturalLandmarks: ['Pico do Fogo (Volcano)', 'Tarrafal Bay', 'Salamansa', 'Pedra Lume Salt Crater'],
  },
  'central african republic': {
    climate: 'Tropical savanna with hot, humid conditions.',
    landscape: 'Plateaus and basins with forests and grasslands.',
    majorCities: ['Bangui', 'Berberati', 'Bambari', 'Carnot', 'Bouar'],
    naturalLandmarks: ['Manovo-Gounda St. Floris National Park', 'Boali Waterfalls', 'Bambio Cave', 'Oubangui River'],
  },
  chad: {
    climate: 'Mostly hot, dry desert and semi-desert climate.',
    landscape: 'Sahara Desert in the north, savanna in the south, Lake Chad in the northwest.',
    majorCities: ['N\'Djamena', 'Moundou', 'Abeché', 'Sarh', 'Koumra'],
    naturalLandmarks: ['Lake Chad', 'Tibesti Mountains', 'Ennedi Plateau', 'Dja Faunal Reserve', 'Kanem Desert'],
  },
  chile: {
    climate: 'Ranges from desert in the north to temperate in the center to sub-polar in the south.',
    landscape: 'Andes mountains in the east, coastal plains in the west, extreme length from north to south.',
    majorCities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Punta Arenas', 'Antofagasta'],
    naturalLandmarks: ['Atacama Desert', 'Chilean Lake District', 'Patagonia', 'Easter Island', 'Torres del Paine'],
  },
  china: {
    climate: 'Highly diverse: subtropical in the south, temperate in the center, arctic in far north.',
    landscape: 'Vast and varied with mountains, plateaus, deserts, plains, and extensive coastlines.',
    majorCities: ['Beijing', 'Shanghai', 'Canton (Guangzhou)', 'Shenzhen', 'Chongqing', 'Xi\'an'],
    naturalLandmarks: ['Great Wall', 'Forbidden City', 'Karst Mountains', 'Yangtze River', 'Zhangjiajie National Forest'],
  },
  colombia: {
    climate: 'Tropical in coastal regions, cooler in the Andes highlands, rainforest in Amazon region.',
    landscape: 'Three mountainous ridges (Andes) running north-south, Amazon rainforest in the southeast.',
    majorCities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Santa Marta'],
    naturalLandmarks: ['Lost City (Ciudad Perdida)', 'Coffee Triangle', 'Caño Cristales', 'Tayrona National Park', 'Cocora Valley'],
  },
  comoros: {
    climate: 'Tropical marine climate with warm waters year-round.',
    landscape: 'Volcanic islands with mountainous terrain, tropical vegetation, and coral reefs.',
    majorCities: ['Moroni', 'Mutsamudu', 'Fomboni'],
    naturalLandmarks: ['Mount Karthala (Active Volcano)', 'Karthala National Park', 'Mayotte Island', 'Coral Reefs'],
  },
  'congo (brazzaville)': {
    climate: 'Tropical with wet and dry seasons, hot and humid.',
    landscape: 'Rainforests and wetlands, with savannas in the south. Congo River dominates.',
    majorCities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Owando', 'Makoua'],
    naturalLandmarks: ['Congo River', 'Odzala-Kokoua National Park', 'Likouala Reserve', 'Pool Malebo', 'Lefini Sanctuary'],
  },
  'congo (kinshasa)': {
    climate: 'Tropical rainforest climate, hot and humid year-round.',
    landscape: 'Vast Congo River basin covered with rainforest, bordered by mountains.',
    majorCities: ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Tshikapa'],
    naturalLandmarks: ['Congo River', 'Virunga National Park', 'Okapi Faunal Reserve', 'Garamba National Park', 'Kahuzi-Biega'],
  },
  'costa rica': {
    climate: 'Tropical and subtropical with wet and dry seasons.',
    landscape: 'Mountainous interior with Caribbean and Pacific coasts, covered with rainforests.',
    majorCities: ['San José', 'Limón', 'Alajuela', 'Cartago', 'Puntarenas'],
    naturalLandmarks: ['Arenal Volcano', 'Manuel Antonio National Park', 'Monteverde Cloud Forest', 'Tortuguero National Park'],
  },
  'côte d\'ivoire': {
    climate: 'Tropical savanna in the north, tropical rainforest in the south.',
    landscape: 'Coastal plains with lagoons, forests inland, plateaus in the northwest.',
    majorCities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'Korhogo'],
    naturalLandmarks: ['Comoé National Park', 'Tai National Park', 'Assinie Beach', 'Mont Nimba', 'Lagoons'],
  },
  croatia: {
    climate: 'Mediterranean on the coast, continental inland with cold winters.',
    landscape: 'Mountainous inland with the Adriatic Sea coast dotted with islands.',
    majorCities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Dubrovnik'],
    naturalLandmarks: ['Plitvice Lakes', 'Dubrovnik (Old City)', 'Dalmatian Coast', 'Adriatic Islands', 'Krka Waterfalls'],
  },
  cuba: {
    climate: 'Tropical marine climate with warm waters year-round, hurricane season June-November.',
    landscape: 'Largest Caribbean island with beaches, mountains, and valleys covered in tropical vegetation.',
    majorCities: ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguin', 'Santa Clara'],
    naturalLandmarks: ['Havana Old City', 'Viñales Valley', 'Bay of Pigs', 'Zapata Peninsula', 'El Yunque Falls'],
  },
  cyprus: {
    climate: 'Mediterranean with warm, dry summers and mild winters.',
    landscape: 'Mountainous with two major ranges and central plains, surrounded by Mediterranean coast.',
    majorCities: ['Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta'],
    naturalLandmarks: ['Troodos Mountains', 'Akamas Peninsula', 'Kyrenia Mountains', 'Kolossi Castle', 'Blue Lagoon'],
  },
  'czech republic': {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Bohemian highlands and Moravian highlands, with the Vltava River.',
    majorCities: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec'],
    naturalLandmarks: ['Charles Bridge', 'Prague Castle', 'Karlstein Castle', 'Czech Karst', 'Šumava Mountains'],
  },
  denmark: {
    climate: 'Temperate maritime with mild winters and cool summers.',
    landscape: 'Varied with forests, rolling hills, beaches, and the Jutland Peninsula.',
    majorCities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'],
    naturalLandmarks: ['Kronborg Castle', 'Møn\'s Klint (White Cliffs)', 'Skagen Point', 'Legoland', 'Tivoli Gardens'],
  },
  djibouti: {
    climate: 'Hot arid desert climate, one of the hottest places on Earth.',
    landscape: 'Mostly desert and rocky terrain with volcanic mountains.',
    majorCities: ['Djibouti City', 'Ali Sabieh', 'Tadjourah', 'Obock'],
    naturalLandmarks: ['Lake Assal', 'Bab el Mandab Strait', 'Day Forest', 'Île de Moucha', 'Ardoukoba Volcano'],
  },
  dominica: {
    climate: 'Tropical marine climate with hot, humid conditions.',
    landscape: 'Volcanic island with mountainous terrain, rainforests, and waterfalls.',
    majorCities: ['Roseau', 'Portsmouth'],
    naturalLandmarks: ['Boiling Lake', 'Trafalgar Falls', 'Morne Trois Pitons National Park', 'Scott\'s Head Marine Reserve'],
  },
  'dominican republic': {
    climate: 'Tropical with wet and dry seasons, average temperatures remain warm.',
    landscape: 'Mountainous center with coastal plains, scenic beaches, and rivers.',
    majorCities: ['Santo Domingo', 'Santiago', 'La Romana', 'San Pedro de Macorís', 'Puerto Plata'],
    naturalLandmarks: ['Pico Duarte', 'Samaná Bay', 'Juan Dolio Beach', 'Los Haitises National Park', 'Caribbean coast'],
  },
  ecuador: {
    climate: 'Varies dramatically with elevation: tropical coast, temperate highlands, rainforest Amazon region.',
    landscape: 'Amazon rainforest in the east, Andes mountains in the center, coastal plains in the west.',
    majorCities: ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta'],
    naturalLandmarks: ['Galápagos Islands', 'Cotopaxi Volcano', 'Amazon Rainforest', 'Otavalo Market', 'Baños Hot Springs'],
  },
  egypt: {
    climate: 'Arid desert climate with very little rainfall. Mediterranean coast is milder.',
    landscape: 'Nile River valley and delta in the north, Sahara Desert dominates.',
    majorCities: ['Cairo', 'Alexandria', 'Giza', 'Helwan', 'Tanta', 'Port Said'],
    naturalLandmarks: ['Great Pyramids of Giza', 'Valley of the Kings', 'Luxor Temple', 'Abu Simbel', 'Karnak Temple'],
  },
  'el salvador': {
    climate: 'Tropical with two seasons: hot and rainy (May-October), cooler and dry (November-April).',
    landscape: 'Mountainous with volcanic peaks and frequent seismic activity. Few rivers and limited forests.',
    majorCities: ['San Salvador', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Soyapango'],
    naturalLandmarks: ['Izalco Volcano', 'Ilopango Crater Lake', 'Santa Ana Volcano', 'Conchalhuapa Archaeological Site'],
  },
  'equatorial guinea': {
    climate: 'Tropical equatorial climate with hot, humid conditions year-round.',
    landscape: 'Insular region with volcanic mountains and coastal areas, river basins inland.',
    majorCities: ['Malabo', 'Bata', 'Ebebiyin', 'Mongomo'],
    naturalLandmarks: ['Pico Basile (Volcano)', 'Ureka Beach', 'Corisco Bay', 'Monte Alén National Park'],
  },
  eritrea: {
    climate: 'Hot desert climate with very limited rainfall.',
    landscape: 'Mostly rocky desert plateau with the Red Sea coast.',
    majorCities: ['Asmara', 'Assab', 'Keren', 'Massawa', 'Mendefera'],
    naturalLandmarks: ['Dahlak Archipelago', 'Red Sea', 'Sabean Kingdom Ruins', 'Nefas Mewcha', 'Asmara Modernist Architecture'],
  },
  estonia: {
    climate: 'Temperate continental with cold, long winters and short mild summers.',
    landscape: 'Mostly lowlands with numerous lakes, bogs, and forests. Baltic Sea coast with islands.',
    majorCities: ['Tallinn', 'Tartu', 'Narva', 'Kohtla-Järve', 'Pärnu'],
    naturalLandmarks: ['Tallinn Old City', 'Lahemaa National Park', 'Lake Peipsi', 'Gauja National Park', 'Kunta Gorge'],
  },
  'eswatini (swaziland)': {
    climate: 'Subtropical with wet summers and dry winters.',
    landscape: 'Mountainous terrain with highveld, middleveld, and lowveld regions, with rivers and wildlife.',
    majorCities: ['Mbabane', 'Manzini', 'Big Bend', 'Siteki', 'Piggs Peak'],
    naturalLandmarks: ['Mlilwane Wildlife Sanctuary', 'Hlane Royal National Park', 'Piggs Peak Area', 'Sibebe Rock', 'Mkaya Game Reserve'],
  },
  ethiopia: {
    climate: 'Varies with elevation: tropical lowlands, temperate highlands.',
    landscape: 'Ethiopian Highlands dominate, Great Rift Valley cuts through the center, with deserts in the east and south.',
    majorCities: ['Addis Ababa', 'Dire Dawa', 'Adama', 'Mekelle', 'Hawassa'],
    naturalLandmarks: ['Blue Nile Falls', 'Simien Mountains', 'Great Rift Valley', 'Danakil Depression', 'Lake Tana'],
  },
  'fiji': {
    climate: 'Tropical marine climate with warm waters year-round.',
    landscape: 'Archipelago of mountainous volcanic islands with tropical vegetation and coral reefs.',
    majorCities: ['Suva', 'Lautoka', 'Nadi', 'Labasa'],
    naturalLandmarks: ['Coral Coast', 'Beqa Lagoon', 'Savusavu', 'Taveuni Island', 'Narikoso Waterfall'],
  },
  finland: {
    climate: 'Temperate to subpolar with long, cold winters and short summers.',
    landscape: 'Thousands of lakes, extensive forests, and the Sami region in the far north above the Arctic Circle.',
    majorCities: ['Helsinki', 'Espoo', 'Tampere', 'Turku', 'Oulu'],
    naturalLandmarks: ['Northern Lights (Aurora Borealis)', 'Thousand Lakes', 'Nuuksio National Park', 'Suomenlinna Fortress', 'Lake Inari'],
  },
  france: {
    climate: 'Temperate oceanic west, continental east, Mediterranean south.',
    landscape: 'Alps and Pyrenees mountains, Massif Central plateau, fertile northern plains.',
    majorCities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Strasbourg'],
    naturalLandmarks: ['Eiffel Tower', 'Mont Blanc', 'Mont-Saint-Michel', 'French Riviera', 'Versailles Palace'],
  },
  gabon: {
    climate: 'Tropical equatorial climate with hot, humid conditions year-round.',
    landscape: 'Equatorial rainforest in the interior, coastal plains, and the Congo River basin.',
    majorCities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Mouila'],
    naturalLandmarks: ['Loango National Park', 'Ivindo National Park', 'Lopé-Okanda National Park', 'Gamba Complex', 'Ogooué River'],
  },
  gambia: {
    climate: 'Tropical savanna with hot, dry conditions. Wet season June-September.',
    landscape: 'Narrow country following the Gambia River, with savanna grasslands and wetlands.',
    majorCities: ['Banjul', 'Serekunda', 'Bakau', 'Kadamay', 'Kuntaur'],
    naturalLandmarks: ['Gambia River', 'Baboon Islands', 'Kunta Kinteh Island', 'Sundarban Wetlands', 'James Island'],
  },
  georgia: {
    climate: 'Subtropical on the coast, temperate in the central regions, alpine in the mountains.',
    landscape: 'Caucasus Mountains in the north and south, fertile lowlands in the central areas.',
    majorCities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Gori', 'Zugdidi'],
    naturalLandmarks: ['Mount Elbrus region', 'Caucasus Mountains', 'Borjomi Gorge', 'Signagi Wine Region', 'Black Sea Coast'],
  },
  germany: {
    climate: 'Temperate oceanic to continental with mild summers and cold winters.',
    landscape: 'Northern plains, central highlands, southern Bavarian Alps.',
    majorCities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart'],
    naturalLandmarks: ['Brandenburg Gate', 'Neuschwanstein Castle', 'Black Forest', 'Bavarian Alps', 'Romantic Road'],
  },
  ghana: {
    climate: 'Tropical with hot, humid coastal region and drier interior.',
    landscape: 'Coastal plains, forests in central region, savanna in the north.',
    majorCities: ['Accra', 'Kumasi', 'Takoradi', 'Tema', 'Sekondi', 'Koforidua'],
    naturalLandmarks: ['Cape Coast Castle', 'Kakum National Park', 'Volta Lake', 'Mole National Park', 'Bui National Park'],
  },
  greece: {
    climate: 'Mediterranean with warm, dry summers and mild winters.',
    landscape: 'Mountainous mainland with extensive islands, scattered throughout the Aegean and Ionian Seas.',
    majorCities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larisa'],
    naturalLandmarks: ['Parthenon', 'Delphi Archaeological Site', 'Meteora Monasteries', 'Santorini Volcano', 'Crete'],
  },
  grenada: {
    climate: 'Tropical marine with warm water year-round.',
    landscape: 'Volcanic island with high mountains, tropical vegetation, and beaches.',
    majorCities: ['Saint George\'s', 'Grenville'],
    naturalLandmarks: ['Grand Anse Beach', 'Seven Sisters Waterfalls', 'Annandale Falls', 'Concord Waterfall', 'Underwater Sculpture Park'],
  },
  guatemala: {
    climate: 'Tropical lowlands, temperate highlands with distinct wet and dry seasons.',
    landscape: 'Mountainous with volcanic peaks, tropical lowlands, and elevated plateaus.',
    majorCities: ['Guatemala City', 'Quetzaltenango', 'Escuintla', 'Mazatenango', 'Puerto Barrios'],
    naturalLandmarks: ['Tikal Mayan Ruins', 'Lake Atitlán', 'Chichicastenango Market', 'Antigua', 'Pacaya Volcano'],
  },
  guinea: {
    climate: 'Tropical with hot, humid conditions and a strong monsoon season.',
    landscape: 'Coastal plains transition to forested highlands and savanna plateaus.',
    majorCities: ['Conakry', 'Kindia', 'Mamou', 'Faranah', 'Labé'],
    naturalLandmarks: ['Fouta Djallon Highlands', 'Guinea Savanna', 'Îles de Los', 'Kindia Botanical Garden', 'Mount Nimba'],
  },
  'guinea-bissau': {
    climate: 'Tropical with hot, humid conditions and monsoon rains.',
    landscape: 'Low-lying coastal plains with swamps, transitioning to savanna inland.',
    majorCities: ['Bissau', 'Gabu', 'Cacheu', 'Bafata'],
    naturalLandmarks: ['Bijagós Archipelago', 'Cacheu River', 'Geba River', 'Rice Paddies', 'Saltworks'],
  },
  guyana: {
    climate: 'Tropical with hot, humid conditions and high rainfall.',
    landscape: 'Amazon rainforest in the south and west, coastal plains in the north.',
    majorCities: ['Georgetown', 'Linden', 'New Amsterdam', 'Corriverton', 'Bartica'],
    naturalLandmarks: ['Kaieteur Falls', 'Orinoco Delta', 'Iwokrama Rainforest', 'Shell Beach', 'Rupununi Savanna'],
  },
  haiti: {
    climate: 'Tropical with hot, humid conditions and hurricane season.',
    landscape: 'Mountainous island with fertile valleys and coastal areas.',
    majorCities: ['Port-au-Prince', 'Cap-Haïtien', 'Les Cayes', 'Jacmel', 'Saint-Marc'],
    naturalLandmarks: ['Citadelle Laferrière Fortress', 'Pic la Selle', 'Hispaniola Island', 'Jacmel Beach', 'Saut-d\'Eau Waterfall'],
  },
  honduras: {
    climate: 'Tropical coastal lowlands, temperate highlands with distinct wet and dry seasons.',
    landscape: 'Mountainous interior with Caribbean coast, Pacific coast to the south.',
    majorCities: ['Tegucigalpa', 'San Pedro Sula', 'La Ceiba', 'Choloma', 'Choluteca'],
    naturalLandmarks: ['Roatán Island', 'Great Barrier Reef', 'Copán Mayan Ruins', 'Bay Islands', 'Pico Bonito National Park'],
  },
  hungary: {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Danube River flows through, with Central European plains and foothills.',
    majorCities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs'],
    naturalLandmarks: ['Lake Balaton', 'Danube River', 'Parliament Building', 'Thermal Baths', 'Plitvice Lakes area'],
  },
  iceland: {
    climate: 'Subarctic to arctic with long, cold winters and short summers.',
    landscape: 'Volcanic island with glaciers, waterfalls, geysers, black sand beaches, and lava fields.',
    majorCities: ['Reykjavik', 'Hafnarfjördur', 'Kópavogur', 'Akureyri'],
    naturalLandmarks: ['Northern Lights', 'Blue Lagoon', 'Geysir Geyser', 'Gullfoss Waterfall', 'Mývatn Lake'],
  },
  india: {
    climate: 'Mostly tropical with distinct wet and dry seasons; northern regions temperate to alpine.',
    landscape: 'Himalayas in the north, Deccan Plateau in the south, extensive coastlines.',
    majorCities: ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad'],
    naturalLandmarks: ['Taj Mahal', 'Himalayas', 'Kerala Backwaters', 'Jaipur City Palace', 'Sundarbans Tiger Reserve'],
  },
  indonesia: {
    climate: 'Tropical equatorial with hot, humid conditions year-round.',
    landscape: 'Archipelago of over 17,000 islands with volcanic mountains, rainforests, and beaches.',
    majorCities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
    naturalLandmarks: ['Mount Bromo Volcano', 'Bali Rice Terraces', 'Borobudur Temple', 'Komodo Dragons', 'Raja Ampat Islands'],
  },
  iran: {
    climate: 'Mostly arid and semi-arid with hot summers and cold winters at altitude.',
    landscape: 'High plateaus surrounded by mountain ranges, with deserts and coastal plains.',
    majorCities: ['Tehran', 'Mashhad', 'Isfahan', 'Tabriz', 'Shiraz'],
    naturalLandmarks: ['Isfahan Persian Bazaar', 'Persepolis Ruins', 'Caspian Sea Coast', 'Kaleidoscope Dome', 'Karun River Gorge'],
  },
  iraq: {
    climate: 'Desert and semi-desert climate with hot, dry conditions.',
    landscape: 'Tigris-Euphrates river valley, desert plains, northern mountains.',
    majorCities: ['Baghdad', 'Mosul', 'Basra', 'Kirkuk', 'Irbil'],
    naturalLandmarks: ['Marsh Arab Wetlands', 'Zagros Mountains', 'Tigris River', 'Kutha', 'Hatra Archaeological Site'],
  },
  ireland: {
    climate: 'Temperate maritime with mild winters and cool summers, frequent rainfall.',
    landscape: 'Rolling hills, bogs, and moorlands, with dramatic coastlines and rocky cliffs.',
    majorCities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford'],
    naturalLandmarks: ['Cliffs of Moher', 'Giant\'s Causeway', 'Skellig Michael', 'Ring of Kerry', 'Newgrange Passage Tomb'],
  },
  'iso 3166-1 alpha-3:ita': {
    climate: 'Mediterranean in the south, temperate continental in the north.',
    landscape: 'Apennine Mountains running north-south, Alps in the north, extensive coastlines.',
    majorCities: ['Rome', 'Milan', 'Naples', 'Turin', 'Genoa'],
    naturalLandmarks: ['Colosseum', 'Leaning Tower of Pisa', 'Venice Canals', 'Amalfi Coast', 'Mount Vesuvius'],
  },
  italy: {
    climate: 'Mediterranean in the south, temperate continental in the north.',
    landscape: 'Apennine Mountains running north-south, Alps in the north, extensive coastlines.',
    majorCities: ['Rome', 'Milan', 'Naples', 'Turin', 'Genoa'],
    naturalLandmarks: ['Colosseum', 'Leaning Tower of Pisa', 'Venice Canals', 'Amalfi Coast', 'Mount Vesuvius'],
  },
  jamaica: {
    climate: 'Tropical marine with warm water year-round.',
    landscape: 'Mountainous island with Blue Mountains, lush vegetation, and scenic beaches.',
    majorCities: ['Kingston', 'Saint Andrew', 'Montego Bay', 'Spanish Town', 'May Pen'],
    naturalLandmarks: ['Dunn\'s River Falls', 'Blue Mountains', 'Seven Mile Beach', 'Negril Cliffs', 'Doctor\'s Cave Beach'],
  },
  japan: {
    climate: 'Temperate monsoon with four distinct seasons, hot humid summers and cold winters in the north.',
    landscape: 'Mountainous and volcanic archipelago with dense forests and extensive coastlines.',
    majorCities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Kobe'],
    naturalLandmarks: ['Mount Fuji', 'Arashiyama Bamboo Grove', 'Fushimi Inari Shrine', 'Golden Pavilion', 'Japanese Alps'],
  },
  jordan: {
    climate: 'Desert climate with hot, dry conditions.',
    landscape: 'Mountains transitioning to desert, with the Dead Sea and Jordan River defining borders.',
    majorCities: ['Amman', 'Zarqa', 'Irbid', 'Salt', 'Jerash'],
    naturalLandmarks: ['Petra', 'Dead Sea', 'Wadi Rum Desert', 'Mount Nebo', 'Jerash Roman Ruins'],
  },
  kazakhstan: {
    climate: 'Continental with cold winters and warm summers, semi-arid grasslands.',
    landscape: 'Mostly steppe and semi-desert, with forests and mountains in the east.',
    majorCities: ['Nur-Sultan', 'Almaty', 'Karaganda', 'Aktobe', 'Taraz'],
    naturalLandmarks: ['Big Almaty Lake', 'Charyn Canyon', 'Turkestan Mausoleum', 'Baikonur Cosmodrome', 'Lake Balkhash'],
  },
  kenya: {
    climate: 'Tropical coastal region, temperate highland, arid and semi-arid interior.',
    landscape: 'Great Rift Valley dominates, with mountains, savannas, and coastal plains.',
    majorCities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    naturalLandmarks: ['Masai Mara', 'Mount Kenya', 'Lake Victoria', 'Amboseli National Park', 'Lamu Island'],
  },
  'kiribati': {
    climate: 'Tropical marine climate with warm ocean temperatures.',
    landscape: 'Atolls and volcanic islands scattered across the Pacific Ocean.',
    majorCities: ['South Tarawa', 'Betio'],
    naturalLandmarks: ['Phoenix Islands', 'Christmas Island Atoll', 'Tarawa Atoll', 'Bairiki'],
  },
  'korea (republic of)': {
    climate: 'Humid continental in the north, humid subtropical in the south.',
    landscape: 'Mountainous with lowlands in western and southern coastal areas.',
    majorCities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju'],
    naturalLandmarks: ['Seoraksan National Park', 'Jeju Volcanic Island', 'N Seoul Tower', 'Gyeongju Historic Sites', 'DMZ'],
  },
  'korea (democratic people\'s republic of)': {
    climate: 'Continental with cold dry winters and hot humid summers.',
    landscape: 'Mountainous in the north and east, flatter plains in the west.',
    majorCities: ['Pyongyang', 'Hamhung', 'Nampo', 'Chongjin', 'Sinuiju', 'Wonsan'],
    naturalLandmarks: ['Mount Paektu', 'Myohyang Mountains', 'Mansudae Hill', 'Kaesong', 'Kumgangsan Mountain'],
  },
  kuwait: {
    climate: 'Hot desert climate with extremely hot summers and mild winters.',
    landscape: 'Mostly flat sandy desert plain with minimal vegetation.',
    majorCities: ['Kuwait City', 'Salmiya', 'Sabah Al-Salem', 'Farwaniya', 'Ahmadi'],
    naturalLandmarks: ['Kuwait Towers', 'Failaka Island', 'Al Shaheed Park', 'Scientific Center', 'Kuwait National Museum'],
  },
  kyrgyzstan: {
    climate: 'Continental with cold winters and warm summers at lower elevations.',
    landscape: 'Mountainous with the Tian Shan ranges dominating, surrounded by high valleys.',
    majorCities: ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Kyzyl-Kia'],
    naturalLandmarks: ['Issyk-Kul Lake', 'Tian Shan Mountains', 'Peak Lenin', 'Ala-Archa Canyon', 'Son-Kul Lake'],
  },
  laos: {
    climate: 'Tropical monsoon with hot, humid summers and mild winters.',
    landscape: 'Mostly mountainous with dense forests and river valleys.',
    majorCities: ['Vientiane', 'Luang Prabang', 'Savannakhet', 'Pakse', 'Thakhek'],
    naturalLandmarks: ['Luang Prabang Buddhist Temples', 'Mekong River', '4000 Islands', 'Kuang Si Falls', 'That Luang Stupa'],
  },
  latvia: {
    climate: 'Temperate continental with cold winters and mild summers.',
    landscape: 'Lowlands with forests, lakes, and a Baltic Sea coast.',
    majorCities: ['Riga', 'Daugavpils', 'Liepaja', 'Jelgava', 'Ventspils'],
    naturalLandmarks: ['Riga Old Town', 'Gauja National Park', 'Cape Kolka', 'Lake Engure', 'Sigulda Castles'],
  },
  lebanon: {
    climate: 'Mediterranean with warm, dry summers and mild, wet winters.',
    landscape: 'Coastal plain backed by two mountain ranges: Lebanon and Anti-Lebanon Mountains.',
    majorCities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatiye'],
    naturalLandmarks: ['Cedars of Lebanon', 'Baalbek Ruins', 'Byblos Ancient City', 'Jeita Grotto', 'Mount Lebanon range'],
  },
  lesotho: {
    climate: 'Temperate highland with cold winters and mild summers.',
    landscape: 'Mountainous terrain surrounded by mountains, with the Drakensberg Range.',
    majorCities: ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Leribe', 'Quthing'],
    naturalLandmarks: ['Sehlabathebe National Park', 'Drakensberg Amphitheatre', 'Sani Mountain Pass', 'Botsoela Falls', 'Afriski Mountain Resort'],
  },
  liberia: {
    climate: 'Tropical with hot, humid conditions and high rainfall.',
    landscape: 'Coastal plains, tropical rainforest interior, transitioning to savanna.',
    majorCities: ['Monrovia', 'Gbarnga', 'Kakata', 'Tubmanburg', 'Voinjama'],
    naturalLandmarks: ['Sapo National Park', 'Firestone Plantation', 'Pepper Coast', 'Lake Piso', 'Lofa River'],
  },
  libya: {
    climate: 'Mostly hot desert climate with minimal rainfall.',
    landscape: 'Dominated bythe Sahara Desert with the Mediterranean coast in the north.',
    majorCities: ['Tripoli', 'Benghazi', 'Misrata', 'Al Bayda', 'Zawiya'],
    naturalLandmarks: ['Sahara Desert', 'Mediter Coastline', 'Cylene and Apollonia Ruins', 'Tadrart Acacus Desert', 'Ghadames Old Town'],
  },
  liechtenstein: {
    climate: 'Alpine with cold, snowy winters and mild summers.',
    landscape: 'Mountainous with Alpine peaks and valleys, surrounded by higher elevations.',
    majorCities: ['Vaduz', 'Schaan', 'Planken', 'Triesen'],
    naturalLandmarks: ['Vaduz Castle', 'Principality Ridge', 'Rhine Valley', 'Getschmaran Peak', 'Alpine meadows'],
  },
  lithuania: {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Lowlands with forests, lakes, and a Baltic Sea coast.',
    majorCities: ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys'],
    naturalLandmarks: ['Vilnius Old Town', 'Trakai Castle', 'Curonian Spit', 'Hill of Crosses', 'Aukstaitija National Park'],
  },
  luxembourg: {
    climate: 'Temperate maritime with mild winters and cool summers.',
    landscape: 'Rolling hills, forests, and river valleys; nestled in the Ardennes region.',
    majorCities: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange'],
    naturalLandmarks: ['Luxembourg City Old Town', 'Adolphe Bridge', 'Müllerthal Trail', 'Vianden Castle', 'Meuse Valley'],
  },
  madagascar: {
    climate: 'Tropical and subtropical with hot, humid coastal region and cooler highlands.',
    landscape: 'Large island with distinct regions: central highlands, eastern rainforest, western plateau.',
    majorCities: ['Antananarivo', 'Toliara', 'Antsirabe', 'Fianarantsoa', 'Sambava'],
    naturalLandmarks: ['Avenue of the Baobabs', 'Isalo National Park', 'Baobab Forest', 'Nosy Boraha Island', 'Ankarafantsika Forest'],
  },
  malawi: {
    climate: 'Subtropical with hot, wet summers and cool, dry winters.',
    landscape: 'Mountainous terrain with Lake Malawi dominating the eastern border.',
    majorCities: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Kasungu', 'Zomba'],
    naturalLandmarks: ['Lake Malawi', 'Liwonde National Park', 'Mulanje Mountain', 'Cape Maclear', 'Lengwe National Park'],
  },
  malaysia: {
    climate: 'Tropical equatorial with hot, humid conditions year-round.',
    landscape: 'Peninsular Malaysia with Kuala Lumpur region, and East Malaysia (Borneo) with rainforests.',
    majorCities: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Subang Jaya'],
    naturalLandmarks: ['Petronas Twin Towers', 'Batu Caves', 'Bukit Kinabalu Mountain', 'Taman Negara Rainforest', 'Penang Island'],
  },
  maldives: {
    climate: 'Tropical marine with warm ocean temperatures year-round.',
    landscape: 'Atolls and small coral islands scattered in the Indian Ocean.',
    majorCities: ['Malé', 'Addu City'],
    naturalLandmarks: ['Coral Reefs', 'Bioluminescent Lagoon', 'Blue Lagoon', 'Local Islands', 'Thila Underwater Sites'],
  },
  mali: {
    climate: 'Hot and semi-arid in the south transitioning to desert in the north.',
    landscape: 'Sahara Desert in the north, savanna and lakes in the south, Niger River valley.',
    majorCities: ['Bamako', 'Ségou', 'Mopti', 'Gao', 'Kayes'],
    naturalLandmarks: ['Timbuktu', 'Djenné Mosque', 'Niger River', 'Bandiagara Escarpment', 'Lake Debo'],
  },
  malta: {
    climate: 'Mediterranean with warm, dry summers and mild winters.',
    landscape: 'Limestone island with rocky coasts and limited vegetation, harbors.',
    majorCities: ['Valletta', 'Mosta', 'Sliema', 'St. Julian\'s'],
    naturalLandmarks: ['Valletta Old City', 'Hypogeum Underground Temple', 'Popeye Village', 'Blue Grotto', 'Côminotto Island'],
  },
  'marshall islands': {
    climate: 'Tropical marine climate with warm ocean temperatures.',
    landscape: 'Atolls and volcanic islands scattered in the Pacific Ocean.',
    majorCities: ['Majuro', 'Ebeye'],
    naturalLandmarks: ['Majuro Lagoon', 'Kwajalein Atoll', 'Bikini Atoll', 'Jellyfish Lake', 'War Relics'],
  },
  mauritania: {
    climate: 'Hot desert climate with minimal rainfall.',
    landscape: 'Mostly Sahara Desert with some oasis regions in the south and coastal strip in the west.',
    majorCities: ['Nouakchott', 'Nouâdhibou', 'Kaédi', 'Rosso', 'Atar'],
    naturalLandmarks: ['Sahara Desert', 'Banc d\'Arguin National Park', 'Atar Region', 'Chinguetti', 'Terjit Oasis'],
  },
  mauritius: {
    climate: 'Tropical marine with warm ocean temperatures and cyclone season November-May.',
    landscape: 'Central plateau surrounded by coastal plains, volcanic peaks in the south.',
    majorCities: ['Port Louis', 'Beau-Bassin', 'Curepipe', 'Vacoas', 'Phoenix'],
    naturalLandmarks: ['Black River Gorges National Park', 'Chamarel Waterfall', 'Île aux Cerfs', 'Pamplemousses Garden', 'Volcanic crater'],
  },
  mexico: {
    climate: 'Tropical coasts, temperate midlands, arid deserts in the north.',
    landscape: 'High plateaus, mountain ranges, significant tropical regions.',
    majorCities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'],
    naturalLandmarks: ['Chichen Itza', 'Cenotes', 'Copper Canyon', 'Palenque Ruins', 'Teotihuacan Pyramids'],
  },
  'micronesia': {
    climate: 'Tropical marine with warm ocean temperatures.',
    landscape: 'Mountainous volcanic islands and low-lying coral atolls in the Pacific.',
    majorCities: ['Palikir', 'Kolonia'],
    naturalLandmarks: ['Pohnpei Island', 'Kosrae Island', 'Chuuk Lagoon', 'Nan Madol Ruins', 'Sokehs Rock'],
  },
  moldova: {
    climate: 'Temperate continental with warm summers and cold winters.',
    landscape: 'Rolling hills and plateaus, with the Dniester River forming the eastern border.',
    majorCities: ['Chișinău', 'Bălți', 'Tiraspol', 'Bender', 'Soroca'],
    naturalLandmarks: ['Old Town Chișinău', 'Orheiul Vechi', 'Soroca Fortress', 'Nistru River', 'Dniester River Gorge'],
  },
  monaco: {
    climate: 'Mediterranean with warm, dry summers and mild winters.',
    landscape: 'Small principality on the French Riviera coast, surrounded by mountains.',
    majorCities: ['Monaco', 'Monte Carlo'],
    naturalLandmarks: ['Prince\'s Palace', 'Casino Monte Carlo', 'Cathedral', 'Oceanographic Museum', 'Jardin Exotique'],
  },
  mongolia: {
    climate: 'Continental with cold winters and brief cool summers.',
    landscape: 'Gobi Desert in the south, grassst steppes in the central, mountains in the north and west.',
    majorCities: ['Ulaanbaatar', 'Darkhan', 'Erdenet', 'Choibalsan'],
    naturalLandmarks: ['Gobi Desert', 'Khustain Nuruu National Park', 'Lake Khövsgöl', 'Flaming Cliffs', 'Terelj River Gorge'],
  },
  montenegro: {
    climate: 'Mediterranean on the coast, continental inland.',
    landscape: 'Mountainous with Adriatic Sea coast and valleys.',
    majorCities: ['Podgorica', 'Nikšić', 'Cetinje', 'Berane'],
    naturalLandmarks: ['Bay of Kotor', 'Durmitor National Park', 'Ostrog Monastery', 'Lovćen Mountain', 'Lake Skadar'],
  },
  morocco: {
    climate: 'Mediterranean and desert climates. Coastal regions mild, interior hot and dry.',
    landscape: 'Atlas Mountains Running north-south, Sahara Desert in the south, coastal plains.',
    majorCities: ['Casablanca', 'Fez', 'Marrakesh', 'Tangier', 'Agadir'],
    naturalLandmarks: ['Sahara Desert', 'Atlas Mountains', 'Kasbah Aitbenhaddou', 'Medinas (old cities)', 'Anti-Atlas Mountains'],
  },
  mozambique: {
    climate: 'Tropical and subtropical with hot, humid coastal conditions.',
    landscape: 'Coastal plains, plateaus inland, mountains in the west. Zambezi River dominates.',
    majorCities: ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio'],
    naturalLandmarks: ['Inhambane Province', 'Gorongosa National Park', 'Bazaruto Archipelago', 'Vilanculos Beach', 'Mount Binga'],
  },
  myanmar: {
    climate: 'Tropical monsoon with hot, humid conditions.',
    landscape: 'Mountainous terrain with river valleys, covered with tropical forests.',
    majorCities: ['Yangon', 'Naypyidaw', 'Mandalay', 'Bagan', 'Tachileik'],
    naturalLandmarks: ['Shwedagon Pagoda', 'Bagan Temples', 'Inle Lake', 'Irrawaddy River', 'Golden Rock'],
  },
  namibia: {
    climate: 'Semi-arid and arid desert climate.',
    landscape: 'Namib Desert, central plateau, and savanna regions.',
    majorCities: ['Windhoek', 'Walvis Bay', 'Rundu', 'Oshakati'],
    naturalLandmarks: ['Namib Desert', 'Skeleton Coast', 'Etosha National Park', 'Fish River Canyon', 'Sossusvlei Dunes'],
  },
  nauru: {
    climate: 'Tropical marine with warm ocean temperatures.',
    landscape: 'Smallest independent nation, single coral island.',
    majorCities: ['Yaren', 'Meneng'],
    naturalLandmarks: ['Anibare Bay', 'Buota Point', 'Coral Reef', 'Command Ridge'],
  },
  nepal: {
    climate: 'Subtropical in the south, temperate in the hills, alpine in the Himalayas.',
    landscape: 'Himalayan mountains in the north, including Mount Everest, fertile valleys in the south.',
    majorCities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Bharatpur'],
    naturalLandmarks: ['Mount Everest', 'Lumbini (Birthplace of Buddha)', 'Annapurna Circuit', 'Kathmandu Temples', 'Phewa Lake'],
  },
  netherlands: {
    climate: 'Temperate maritime with mild winters and cool summers, frequent rainfall.',
    landscape: 'Mostly flat lowlands with few hills, extensive network of canals and waterways.',
    majorCities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Groningen'],
    naturalLandmarks: ['Windmills', 'Anne Frank House', 'Canals of Amsterdam', 'Frisian Islands', 'Afsluitdijk Dam'],
  },
  'new zealand': {
    climate: 'Temperate maritime with mild winters and cool summers.',
    landscape: 'Two main islands with diverse terrain: mountains, fjords, rainforests, and volcanic plateaus.',
    majorCities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'],
    naturalLandmarks: ['Fiordland National Park', 'Mount Cook', 'Rotorua Geothermal Area', 'Hobbiton (Shire from LOTR)', 'Milford Sound'],
  },
  nicaragua: {
    climate: 'Tropical with distinct wet and dry seasons.',
    landscape: 'High volcanic plateau in the center bordered by Caribbean and Pacific coasts.',
    majorCities: ['Managua', 'León', 'Granada', 'Masaya', 'San Juan del Sur'],
    naturalLandmarks: ['Lake Nicaragua', 'Ometepe Island', 'San Juan River', 'Granada Colonial City', 'Masaya Volcano'],
  },
  niger: {
    climate: 'Hot, arid, and semi-arid desert climate.',
    landscape: 'Mostly Sahara Desert with Niger River valley in the south.',
    majorCities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Iarua'],
    naturalLandmarks: ['Niger River', 'Sahara Desert', 'Air Mountains', 'Timia Valley', 'Agadez Mosque'],
  },
  nigeria: {
    climate: 'Tropical and subtropical with wet and dry seasons.',
    landscape: 'Niger River dominates, with tropical forests in the south and savanna in the north.',
    majorCities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'],
    naturalLandmarks: ['Yankari Game Reserve', 'Cross River National Park', 'Oshun Sacred Groves', 'Garki National Museum'],
  },
  'north macedonia': {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Mountainous Balkans with mountains dominating, Lake Ohrid on the western border.',
    majorCities: ['Skopje', 'Bitola', 'Kumanovo', 'Prilepe', 'Tetovo'],
    naturalLandmarks: ['Ohrid Lake', 'Matka Canyon', 'Stone Bridge of Skopje', 'Baba Mountain', 'Plog Mountain'],
  },
  norway: {
    climate: 'Subarctic to temperate depending on region, milder on the west coast.',
    landscape: 'Mountainous with deep fjords, extensive forests, and glaciers.',
    majorCities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand'],
    naturalLandmarks: ['Geirangerfjord', 'Lofoten Islands', 'Preikestolen (Pulpit Rock)', 'Northern Lights', 'Sognefjord'],
  },
  oman: {
    climate: 'Hot desert climate with very hot summers and warm winters.',
    landscape: 'Mostly rocky desert with mountains and coastal areas.',
    majorCities: ['Muscat', 'Salalah', 'Sur', 'Nizwa', 'Sohar'],
    naturalLandmarks: ['Khareef Monsoon Season (Dhofar)', 'Wadi Darbat', 'Musandam Fjords', 'Wadis', 'Al Hajar Mountains'],
  },
  pakistan: {
    climate: 'Mostly arid and semi-arid with hot summers and cool winters at altitude.',
    landscape: 'Indus River plain in the east, mountains and plateaus in the north and west.',
    majorCities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Multan'],
    naturalLandmarks: ['K2 Mountain', 'Himalayan Range', 'Karakoram Highway', 'Hunza Valley', 'Mohenjo-daro Ruins'],
  },
  palau: {
    climate: 'Tropical marine with warm ocean temperatures and high rainfall.',
    landscape: 'Archipelago of volcanic islands and coral atolls in the Pacific.',
    majorCities: ['Ngerulmud', 'Koror'],
    naturalLandmarks: ['Jellyfish Lake', 'Palau Barrier Reef', 'Rock Island Lagoon', 'Bai (traditional meetinghouse)', 'Ngardmau Waterfall'],
  },
  'panama': {
    climate: 'Tropical with hot, humid conditions year-round.',
    landscape: 'Narrow isthmus connecting Central and South America, with rainforests and islands.',
    majorCities: ['Panama City', 'San Miguelito', 'Juan Díaz', 'Tocumen', 'Colón'],
    naturalLandmarks: ['Panama Canal', 'Boquete Coffee Region', 'San Blas Islands', 'Darien Gap Rainforest', 'Gatun Lake'],
  },
  'papua new guinea': {
    climate: 'Tropical rainforest climate with hot, humid conditions year-round.',
    landscape: 'Mountainous interior with dense rainforests, tropical islands.',
    majorCities: ['Port Moresby', 'Lae', 'Madang', 'Mount Hagen', 'Goroka'],
    naturalLandmarks: ['Mount Wilhelm', 'Kokoda Trail', 'Varirata National Park', 'Sepik River', 'Coral Triangle'],
  },
  paraguay: {
    climate: 'Subtropical with hot summers and mild winters.',
    landscape: 'Mostly low-lying plains and plateaus divided by the Paraguay River.',
    majorCities: ['Asunción', 'Ciudad del Este', 'Encarnación', 'San Juan Bautista', 'Villarrica'],
    naturalLandmarks: ['Iguazu Falls area', 'Chocó region', 'Ría Paraná', 'Pantanal region', 'Yacyretá Dam'],
  },
  peru: {
    climate: 'Tropical in the Amazon, temperate in the highlands, arid on the coast.',
    landscape: 'Andes mountains dominate, Amazon rainforest in the east, coastal deserts.',
    majorCities: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Iquitos'],
    naturalLandmarks: ['Machu Picchu', 'Sacred Valley', 'Amazon Rainforest', 'Lake Titicaca', 'Nazca Lines'],
  },
  philippines: {
    climate: 'Tropical monsoon with hot, humid conditions.',
    landscape: 'Archipelago of over 7,600 islands with mountains and tropical vegetation.',
    majorCities: ['Manila', 'Quezon City', 'Caloocan', 'Davao', 'Cebu City'],
    naturalLandmarks: ['Chocolate Hills', 'Mayon Volcano', 'Palawan Limestone Cliffs', 'Taal Volcano', 'Banaue Rice Terraces'],
  },
  poland: {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Northern plains transitioning to highlands and mountains in the south.',
    majorCities: ['Warsaw', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk'],
    naturalLandmarks: ['Tatra Mountains', 'Baltic Coast', 'Białowieża Forest', 'Auschwitz Memorial', 'Warsaw Old Town'],
  },
  portugal: {
    climate: 'Mediterranean on the south and coast, temperate in the north.',
    landscape: 'Coastal plains with mountains in the north, rolling hills throughout.',
    majorCities: ['Lisbon', 'Porto', 'Braga', 'Covilhã', 'Évora'],
    naturalLandmarks: ['Sintra-Cascais Range', 'Algarve Beaches', 'Douro Valley', 'Pena Palace', 'Jeronimos Monastery'],
  },
  qatar: {
    climate: 'Hot desert climate with extremely hot summers and mild winters.',
    landscape: 'Mostly flat sandy desert peninsula with no major forests or mountains.',
    majorCities: ['Doha', 'Al Rayyan', 'Umm Sa\'id', 'Al Khor'],
    naturalLandmarks: ['Doha Corniche', 'Museum of Islamic Art', 'Al Wakrah Souq', 'Inland Sea (Khor Al Adaid)', 'Pearl Farming'],
  },
  'romania': {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Carpathian Mountains in the center, with Transylvania plateau and Danube delta.',
    majorCities: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța'],
    naturalLandmarks: ['Carpathian Mountains', 'Danube Delta', 'Bran Castle', 'Brașov Medieval City', 'Lake Snagov'],
  },
  'russian federation': {
    climate: 'Continental to subarctic with very long, cold winters.',
    landscape: 'World\'s largest country spanning Europe and Asia, diverse terrain from forests to deserts.',
    majorCities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod'],
    naturalLandmarks: ['Lake Baikal', 'Mount Elbrus', 'Kamchatka Volcanoes', 'Siberian Taiga', 'Altai Mountains'],
  },
  russia: {
    climate: 'Continental to subarctic with very long, cold winters.',
    landscape: 'World\'s largest country spanning Europe and Asia, diverse terrain from forests to deserts.',
    majorCities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod'],
    naturalLandmarks: ['Lake Baikal', 'Mount Elbrus', 'Kamchatka Volcanoes', 'Siberian Taiga', 'Altai Mountains'],
  },
  rwanda: {
    climate: 'Tropical highland with warm, humid conditions and two rainy seasons.',
    landscape: 'Mountainous terrain with volcanic peaks, lakes, and plateaus.',
    majorCities: ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Muhanga'],
    naturalLandmarks: ['Volcanoes National Park', 'Lake Kivu', 'Nyanza Palace', 'Kigali Genocide Memorial', 'Nyungwe Rainforest'],
  },
  'saint kitts and nevis': {
    climate: 'Tropical marine with warm water year-round.',
    landscape: 'Volcanic islands with mountainous terrain and beaches.',
    majorCities: ['Basseterre', 'Charlestown'],
    naturalLandmarks: ['Brimstone Hill Fortress', 'Mount Liamuiga Volcano', 'Frigate Bay', 'Timothy Hill', 'Nevis Peak'],
  },
  'saint lucia': {
    climate: 'Tropical marine with warm water year-round.',
    landscape: 'Volcanic island with mountainous terrain, lush vegetation, and black sand beaches.',
    majorCities: ['Castries', 'Gros Islet', 'Vieux Fort', 'Soufrière'],
    naturalLandmarks: ['Pitons (UNESCO Site)', 'Soufrière Hot Springs', 'Diamond Falls Botanical Garden', 'Anse Chastanet Beach'],
  },
  'saint vincent and the grenadines': {
    climate: 'Tropical marine with warm water year-round.',
    landscape: 'Volcanic island with mountainous terrain and numerous southern islands.',
    majorCities: ['Kingstown', 'Georgetown', 'Barrouallie'],
    naturalLandmarks: ['La Soufrière Volcano', 'Bequia Island', 'Tobago Cays', 'Young Island', 'Black Point Tunnel'],
  },
  samoa: {
    climate: 'Tropical marine with warm ocean temperatures.',
    landscape: 'Volcanic islands with tropical vegetation and coral reefs.',
    majorCities: ['Apia', 'Salelologa'],
    naturalLandmarks: ['O le Pupu-Pue National Park', 'To Sua Trench Pool', 'Lake Lanoto\'o', 'Savai\'i Island', 'Coastal Cliffs'],
  },
  'san marino': {
    climate: 'Temperate with mild winters and warm summers.',
    landscape: 'Mountainous microstate nestled on the Apennine Mountains.',
    majorCities: ['San Marino City'],
    naturalLandmarks: ['Guaita Fortress', 'Basilica of San Marino', 'Cesta Tower', 'Montale Tower', 'Mount Titano'],
  },
  'sao tome and principe': {
    climate: 'Tropical equatorial with hot, humid conditions year-round.',
    landscape: 'Volcanic islands with mountainous terrain and tropical vegetation.',
    majorCities: ['São Tomé', 'Santo António'],
    naturalLandmarks: ['Pico de São Tomé', 'Obo National Park', 'Banana Plantation', 'Rolas Island', 'Beach Resorts'],
  },
  'saudi arabia': {
    climate: 'Hot desert climate with extremely hot summers.',
    landscape: 'Mostly Arabian Desert with Some mountains and coastal plains on the Red Sea.',
    majorCities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'],
    naturalLandmarks: ['Empty Quarter (Rub\' al Khali)', 'Red Sea Coral Reefs', 'Asir Mountains', 'Al-Rajhi Mosque', 'Madinah Old City'],
  },
  senegal: {
    climate: 'Tropical savanna with hot, dry conditions and a monsoon season.',
    landscape: 'Coastal plains transitioning to savanna, semi-arid regions in the north.',
    majorCities: ['Dakar', 'Thiès', 'Kaolack', 'Saint-Louis', 'Tambacounda'],
    naturalLandmarks: ['Lake Retba (Pink Lake)', 'Djoudj National Bird Sanctuary', 'Saint-Louis Island', 'Sine-Saloum Delta', 'Islands of Senegal'],
  },
  serbia: {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Balkan Mountains with river valleys, Danube River forms northern border.',
    majorCities: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica'],
    naturalLandmarks: ['Danube River', 'Kopaonik Mountain', 'Lake Bled area nearby', 'Studenica Monastery', 'Djerdap Gorge'],
  },
  seychelles: {
    climate: 'Tropical marine with warm ocean temperatures year-round.',
    landscape: 'Archipelago of 115 islands with granitic and volcanic formations.',
    majorCities: ['Victoria', 'Beau Vallon'],
    naturalLandmarks: ['Vallée de Mai Nature Reserve', 'Anse Source d\'Argent Beach', 'La Digue Island', 'Praslin Island', 'Coral Reefs'],
  },
  'sierra leone': {
    climate: 'Tropical with hot, humid conditions and monsoon rains.',
    landscape: 'Coastal plains, mountains inland, transitioning to plateau and savanna.',
    majorCities: ['Freetown', 'Kenema', 'Makeni', 'Bo', 'Kailahun'],
    naturalLandmarks: ['Tiwai Island Wildlife Reserve', 'Outamba-Kilimi National Park', 'Gola Rainforest', 'Peninsula Mountains', 'Cape Sierra Leone'],
  },
  singapore: {
    climate: 'Tropical equatorial with hot, humid conditions year-round.',
    landscape: 'City-state on an island with urban development and nature reserves.',
    majorCities: ['Singapore City'],
    naturalLandmarks: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island', 'Changi Beach', 'MacRitchie Reservoir'],
  },
  'slovakia': {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Carpathian Mountains in the center, with lowlands in the south and east.',
    majorCities: ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica'],
    naturalLandmarks: ['High Tatras', 'Low Tatras', 'Plitvice Lakes area nearby', 'Liptov Region', 'Vlkolínec Wooden Village'],
  },
  'slovenia': {
    climate: 'Temperate continental inland, Mediterranean on the coast.',
    landscape: 'Alps in the north, Karst plateau in the south, Adriatic coast.',
    majorCities: ['Ljubljana', 'Maribor', 'Kranj', 'Celje', 'Koper'],
    naturalLandmarks: ['Lake Bled', 'Lake Bohinj', 'Postojna Cave', 'Triglav National Park', 'Škocjan Caves'],
  },
  'solomon islands': {
    climate: 'Tropical marine with warm ocean temperatures and high rainfall.',
    landscape: 'Archipelago of mountainous volcanic islands with coral reefs.',
    majorCities: ['Honiara', 'Auki', 'Gizo'],
    naturalLandmarks: ['Marovo Lagoon', 'Gizo Island', 'Bougainville Strait', 'Iron Bottom Sound', 'Aruligo Hot Springs'],
  },
  somalia: {
    climate: 'Hot arid and semi-arid climate with minimal rainfall.',
    landscape: 'Horn of Africa plateau transitioning to coastal plains and peninsula.',
    majorCities: ['Mogadishu', 'Hargeisa', 'Bosaso', 'Beladweyne', 'Kismayo'],
    naturalLandmarks: ['Indian Ocean Beaches', 'Gulf of Aden Coastline', 'Badlands', 'Laas Geel Ancient Art', 'Ras Asanyo Peninsula'],
  },
  'south africa': {
    climate: 'Mostly temperate with Mediterranean in the southwest and subtropical in the north.',
    landscape: 'Drakensberg Mountains, Highveld plateau, Kruger National Park, diverse biomes.',
    majorCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
    naturalLandmarks: ['Table Mountain', 'Kruger National Park', 'Garden Route', 'Drakensberg Mountains', 'Cape Peninsula'],
  },
  'south korea': {
    climate: 'Humid continental in the north, humid subtropical in the south.',
    landscape: 'Mountainous with lowlands in western and southern coastal areas.',
    majorCities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'],
    naturalLandmarks: ['Seoraksan National Park', 'Jeju Volcanic Island', 'Jirisan National Park', 'Gyeongju Historic Areas', 'N Seoul Tower'],
  },
  'south sudan': {
    climate: 'Tropical and subtropical with hot, humid conditions.',
    landscape: 'Mostly swamps and grasslands with some forest regions.',
    majorCities: ['Juba', 'Wau', 'Malakal', 'Bentiu', 'Kassala'],
    naturalLandmarks: ['White Nile River', 'Sudd Wetlands', 'Boma National Park', 'Imatong Mountains', 'Nile Basin'],
  },
  spain: {
    climate: 'Mediterranean on the coast, continental interior, alpine in the mountains.',
    landscape: 'Iberian Peninsula with mountains, plateaus, and extensive coastlines.',
    majorCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao'],
    naturalLandmarks: ['Sagrada Familia Basilica', 'Alhambra Palace', 'Prado Museum', 'Pyrenees', 'Costa Brava Coast'],
  },
  'sri lanka': {
    climate: 'Tropical monsoon with hot, humid conditions and distinct rainy seasons.',
    landscape: 'Central highlands, coastal plains with extensive beaches.',
    majorCities: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Matara'],
    naturalLandmarks: ['Sigiriya Rock Fortress', 'Temple of the Tooth (Kandy)', 'Yala National Park', 'Ella Nine Arches Bridge', 'Beachesof South Coast'],
  },
  sudan: {
    climate: 'Desert climate in the north, tropical savanna in the south.',
    landscape: 'Nile River valley dominates, Sahara Desert in the much of the country.',
    majorCities: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Gedaref'],
    naturalLandmarks: ['Nile Cataracts', 'Meroe Pyramids', 'Red Sea Hills', 'Sudd Wetlands', 'Dinder National Park'],
  },
  suriname: {
    climate: 'Tropical equatorial with hot,humid conditions and high rainfall.',
    landscape: 'Amazon rainforest in much of the country, coastal plains in the north.',
    majorCities: ['Paramaribo', 'Lelydorp', 'Lelydorp'],
    naturalLandmarks: ['Kaieteur Falls', 'Rainforests', 'Courantyne River', 'Commewijne River', 'Corantijn Nature Park'],
  },
  sweden: {
    climate: 'Temperate to subarctic with cold winters and short summers.',
    landscape: 'Forests, lakes, and mountains in the north, lowlants in the south.',
    majorCities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'],
    naturalLandmarks: ['Stockholm Archipelago', 'Lapland (Arctic Region)', 'Northern Lights', 'Norrbottens Lappland', 'Swedish Mids'],
  },
  switzerland: {
    climate: 'Temperate alpine with cold winters and mild summers.',
    landscape: 'Swiss Alps dominate, with lakes and river valleys.',
    majorCities: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lucerne'],
    naturalLandmarks: ['Swiss Alps', 'Jungfrau Mountain', 'Lake Geneva', 'Matterhorn', 'Rhine Falls'],
  },
  'syrian arab republic': {
    climate: 'Mediterranean coast, hot desert in the interior.',
    landscape: 'Mountains along the coast, plateau and desert regions inland.',
    majorCities: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'],
    naturalLandmarks: ['Anti-Lebanon Mountains', 'Euphrates River', 'Dead Cities', 'Krak des Chevaliers Castle', 'Mediterranean Coast'],
  },
  syria: {
    climate: 'Mediterranean coast, hot desert in the interior.',
    landscape: 'Mountains along the coast, plateau and desert regions inland.',
    majorCities: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'],
    naturalLandmarks: ['Anti-Lebanon Mountains', 'Euphrates River', 'Dead Cities', 'Krak des Chevaliers Castle', 'Mediterranean Coast'],
  },
  taiwan: {
    climate: 'Subtropical in the north and tropical in the south. Monsoonal influenced.',
    landscape: 'Mountainous island with tropical vegetation and coastal plains.',
    majorCities: ['Taipei', 'Taichung', 'Kaohsiung', 'Tainan', 'Hsinchu'],
    naturalLandmarks: ['Taroko Gorge', 'Sun Moon Lake', 'Alishan Mountain', 'Jiufen Old Street', 'Kenting National Park'],
  },
  tajikistan: {
    climate: 'Alpine and continental with cold winters.',
    landscape: 'High mountainous, dominated by the Pamir Range.',
    majorCities: ['Dushanbe', 'Khujand', 'Kulob', 'Qurgonteppa'],
    naturalLandmarks: ['Pamir Mountains', 'Panj River', 'Lake Qarakul', 'Fann Mountains', 'Peak Lenin'],
  },
  tanzania: {
    climate: 'Tropical coastal region, temperate inland highlands.',
    landscape: 'Great Rift Valley dominates, with mountains, plateaus, and African savanna.',
    majorCities: ['Dar es Salaam', 'Mwanza', 'Arusha', 'Mbeya', 'Morogoro'],
    naturalLandmarks: ['Mount Kilimanjaro', 'Mount Meru', 'Serengeti National Park', 'Lake Victoria', 'Zanzibar Island'],
  },
  thailand: {
    climate: 'Tropical monsoon with hot, humid conditions.',
    landscape: 'Central plains, northern mountains, northeastern plateau, southern peninsula.',
    majorCities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Chiang Rai'],
    naturalLandmarks: ['Grand Palace Bangkok', 'Angkor Wat nearby', 'Phuket Beaches', 'Phang Nga Bay', 'Doi Inthanon National Park'],
  },
  'timor-leste': {
    climate: 'Tropical monsoon with hot, humid conditions.',
    landscape: 'Mountainous island with tropical vegetation.',
    majorCities: ['Dili', 'Baucau', 'Maliana'],
    naturalLandmarks: ['Mount Ramelau', 'Atauro Island', 'Lake Ira', 'Jaco Island', 'Nino Konis Santana National Park'],
  },
  togo: {
    climate: 'Tropical and subtropical with distinct wet and dry seasons.',
    landscape: 'Coastal plains, savanna interior, plateau regions.',
    majorCities: ['Lomé', 'Sokodé', 'Kpalimé', 'Atakpamé', 'Dapaong'],
    naturalLandmarks: ['Koutammakou (Forts of Batammariba)', 'Fazao-Malfakassa National Park', 'Lake Volta', 'Mont Agou', 'Cascade Falls'],
  },
  tonga: {
    climate: 'Tropical marine with warm ocean temperatures.',
    landscape: 'Archipelago of volcanic and coral islands in the Pacific.',
    majorCities: ['Nuku\'alofa', 'Pangai'],
    naturalLandmarks: ['Tongatapu Island', 'Ha\'apai Island Group', '\'Eua National Park', 'Tonga\'s Beaches', 'Coral Reefs'],
  },
  'trinidad and tobago': {
    climate: 'Tropical marine with warm water year-round.',
    landscape: 'Twin islands with varying terrain from beaches to mountains.',
    majorCities: ['Port of Spain', 'San Fernando', 'Arima', 'Point Fortin'],
    naturalLandmarks: ['Caroni Swamp', 'Pitch Lake', 'Maracas Bay', 'Manzanilla Beach', 'Rainforest Canopy Walkway'],
  },
  tunisia: {
    climate: 'Mediterranean on the coast, semi-arid interior transitioning to desert.',
    landscape: 'Atlas Mountains, Sahara Desert in the south, coastal plains.',
    majorCities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Gabes'],
    naturalLandmarks: ['Sahara Desert', 'Djerba Island', 'Ksar Ghilane', 'Ichkeul National Park', 'Medina of Tunis'],
  },
  turkey: {
    climate: 'Mediterranean on coasts, continental inland.',
    landscape: 'Anatolian Peninsula with mountains, the Taurus Range in the south, surrounded by seas.',
    majorCities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya'],
    naturalLandmarks: ['Cappadocia Fairy Chimneys', 'Pamukkale Terraces', 'Blue Mosque', 'Hagia Sophia', 'Troy Archaeological Site'],
  },
  turkmenistan: {
    climate: 'Hot desert with cold winters in elevated areas.',
    landscape: 'Mostly Karakum Desert, with mountains in the south and Caspian Sea coast.',
    majorCities: ['Ashgabat', 'Turkmenbashi', 'Turkmenabat', 'Balkanabat'],
    naturalLandmarks: ['Kow Ata Underground Lake', 'Darvaza Gas Crater', 'Mary (Merv) Ancient City', 'Caspian Sea', 'Balkanabat Oil Fields'],
  },
  tuvalu: {
    climate: 'Tropical marine with warm ocean temperatures.',
    landscape: 'Atolls and small islands scattered in the Pacific Ocean.',
    majorCities: ['Funafuti'],
    naturalLandmarks: ['Pacific Atoll Life', 'Coral Reefs', 'Vaitupu Island', 'Nanumea Atoll'],
  },
  uganda: {
    climate: 'Tropical monsoon with hot, humid conditions.',
    landscape: 'Plateaus and highlands, Great Rift Valley, numerous lakes.',
    majorCities: ['Kampala', 'Gulu', 'Lira', 'Arua', 'Mbarara'],
    naturalLandmarks: ['Lake Victoria', 'Rwenzori Mountains', 'Queen Elizabeth National Park', 'Bwindi Impenetrable Forest', 'Zanzibar Stone Town'],
  },
  ukraine: {
    climate: 'Temperate continental with cold winters and warm summers.',
    landscape: 'Mostly lowlands and plateaus, some mountains in the south, Black Sea coast.',
    majorCities: ['Kyiv', 'Kharkiv', 'Odesa', 'Donetsk', 'Zaporizhzhia'],
    naturalLandmarks: ['St. Michael\'s Monastery', 'Sviati Hory Lavra', 'Kamyanets-Podilsky Castle', 'Carpathian Mountains', 'Crimean Riviera'],
  },
  'united arab emirates': {
    climate: 'Hot desert climate with extremely hot summers.',
    landscape: 'Mostly desert, with some mountains and coast along the Persian Gulf.',
    majorCities: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras al-Khaimah'],
    naturalLandmarks: ['Burj Khalifa', 'Palm Jumeirah', 'Desert Safari', 'Sheikh Zayed Grand Mosque', 'Liwa Oasis'],
  },
  'united kingdom': {
    climate: 'Temperate maritime with mild winters and cool summers.',
    landscape: 'Rolling countryside, hilly regions, dramatic coastal cliffs, Lake District.',
    majorCities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
    naturalLandmarks: ['Big Ben', 'Tower of London', 'Stonehenge', 'Giant\'s Causeway', 'Lake District'],
  },
  'united states': {
    climate: 'Highly diverse: arctic Alaska, tropical Hawaii, desert Southwest, temperate East.',
    landscape: 'Rocky Mountains, Great Plains, Appalachian Mountains, Amazon-like forests, deserts.',
    majorCities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    naturalLandmarks: ['Grand Canyon', 'Yellowstone', 'Statue of Liberty', 'Golden Gate Bridge', 'Niagara Falls'],
  },
  usa: {
    climate: 'Highly diverse: arctic Alaska, tropical Hawaii, desert Southwest, temperate East.',
    landscape: 'Rocky Mountains, Great Plains, Appalachian Mountains, Amazon-like forests, deserts.',
    majorCities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    naturalLandmarks: ['Grand Canyon', 'Yellowstone', 'Statue of Liberty', 'Golden Gate Bridge', 'Niagara Falls'],
  },
  uruguay: {
    climate: 'Temperate with mild winters and warm summers.',
    landscape: 'Rolling hills and grasslands, with rivers and coastal areas.',
    majorCities: ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Melo'],
    naturalLandmarks: ['Cabo Polonio', 'Esteros de Farrapos', 'Palmar', 'Cerro de la Reina', 'Atlantic Coastline'],
  },
  uzbekistan: {
    climate: 'Continental with hot summers and cold winters.',
    landscape: 'Mostly covered by deserts with mountains in the east and north.',
    majorCities: ['Tashkent', 'Samarkand', 'Bukhara', 'Kokand', 'Andijan'],
    naturalLandmarks: ['Samarkand City', 'Registan Square', 'Bukhara Bazaar', 'Aral Sea', 'Tien Shan Mountains'],
  },
  vanuatu: {
    climate: 'Tropical marine with warm ocean temperatures.',
    landscape: 'Archipelago of volcanic islands with tropical vegetation.',
    majorCities: ['Port Vila', 'Luganville'],
    naturalLandmarks: ['Mount Yasur Volcano', 'Blue Hole', 'Tanna Island', 'Efate Island', 'Espiritu Santo Island'],
  },
  'vatican city': {
    climate: 'Mediterranean with warm, dry summers and mild winters.',
    landscape: 'Tiny city-state on a hilltop inside Rome, surrounded by high walls.',
    majorCities: ['Vatican City'],
    naturalLandmarks: ['St. Peter\'s Basilica', 'Sistine Chapel', 'Vatican Museums', 'Vatican Gardens', 'Apostolic Palace'],
  },
  venezuela: {
    climate: 'Tropical and subtropical with hot, humid coastal and cooler highlands.',
    landscape: 'Andes mountains in the north, Amazon rainforest in the south, Caribbean coast.',
    majorCities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Ciudad Guayana'],
    naturalLandmarks: ['Angel Falls', 'Margarita Island', 'Los Llanos Grasslands', 'Orinoco River', 'Canaima National Park'],
  },
  vietnam: {
    climate: 'Tropical monsoon with hot, humid conditions.',
    landscape: 'Northern mountains, central highlands, southern Mekong Delta.',
    majorCities: ['Ho Chi Minh City', 'Hanoi', 'Haiphong', 'Da Nang', 'Can Tho'],
    naturalLandmarks: ['Halong Bay', 'Mekong Delta', 'Hoi An Ancient Town', 'Sapa Mountains', 'Cu Chi Tunnels'],
  },
  yemen: {
    climate: 'Hot desert climate with very hot, dry conditions.',
    landscape: 'Mostly mountain ranges with desert plateaus and coastal plains.',
    majorCities: ['Sana\'a', 'Aden', 'Taiz', 'Ibb', 'Al Hodeidah'],
    naturalLandmarks: ['Socotra Island (Galápagos of the Indian Ocean)', 'Hadramawt Valley', 'Tihama Plain', 'Red Sea Coast', 'Rub\' al Khali Desert'],
  },
  zambia: {
    climate: 'Tropical and subtropical with wet and dry seasons.',
    landscape: 'Plateaus with river valleys, Victoria Falls, some forest regions.',
    majorCities: ['Lusaka', 'Kitwe', 'Ndola', 'Mufulira', 'Livingstone'],
    naturalLandmarks: ['Victoria Falls', 'South Luangwa National Park', 'Lake Kariba', 'Lower Zambezi National Park', 'Kafue National Park'],
  },
  zimbabwe: {
    climate: 'Tropical and subtropical with wet and dry seasons.',
    landscape: 'Plateaus with the Zambezi River and Victoria Falls, mountains in the east.',
    majorCities: ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru'],
    naturalLandmarks: ['Victoria Falls', 'Great Zimbabwe Ruins', 'Mount Nyangani', 'Eastern Highlands', 'Hwange National Park'],
  },
};

function normalizeCountryName(name) {
  return String(name || '').trim().toLowerCase();
}

const countryAliases = {
  usa: 'united states',
  'united states of america': 'united states',
  'us': 'united states',
  britain: 'united kingdom',
  england: 'united kingdom',
  scotland: 'united kingdom',
  wales: 'united kingdom',
  'ivory coast': 'cote d\'ivoire',
  'south korea': 'korea (republic of)',
  'north korea': 'korea (democratic people\'s republic of)',
  'russian federation': 'russia',
  'syria': 'syrian arab republic',
};

function getGeographyData(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  return knownGeographyData[keyedName] || null;
}

function getCultureData(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  return knownCultureProfiles[keyedName] || null;
}

function getAttractionsData(countryName, capital) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  if (knownAttractionsData[keyedName]) return knownAttractionsData[keyedName];

  // Use geography natural landmarks as better fallback
  const geo = knownGeographyData[keyedName] || knownGeographyData[normalizedName];
  if (geo && geo.naturalLandmarks && geo.naturalLandmarks.length > 0) {
    return geo.naturalLandmarks.slice(0, 5).map((landmark, i) => ({
      name: landmark,
      city: (geo.majorCities && geo.majorCities[Math.min(i, geo.majorCities.length - 1)]) || capital,
      famousFor: `One of ${countryName}'s most celebrated landmarks and destinations`,
      interestingFact: `A must-visit attraction when traveling through ${countryName}`,
      imageSearchQuery: `${landmark} ${countryName}`,
    }));
  }

  return [
    { name: `${countryName} National Museum`, city: capital, famousFor: "Cultural and historical exhibits", interestingFact: "A must-visit for understanding local heritage", imageSearchQuery: `${countryName} national museum` },
    { name: `${countryName} Historic Center`, city: capital, famousFor: "Architecture and historical landmarks", interestingFact: "The heart of the country's cultural identity", imageSearchQuery: `${countryName} historic center ${capital}` },
    { name: `${countryName} Nature Reserve`, city: capital, famousFor: "Natural beauty and biodiversity", interestingFact: "Home to unique flora and fauna", imageSearchQuery: `${countryName} nature reserve landscape` },
    { name: `${countryName} Central Market`, city: capital, famousFor: "Local goods, crafts, and street food", interestingFact: "A vibrant hub of daily local life", imageSearchQuery: `${countryName} central market ${capital}` },
    { name: `${countryName} Cultural Site`, city: capital, famousFor: "Traditional arts and cultural performances", interestingFact: "Showcases centuries of tradition", imageSearchQuery: `${countryName} cultural site` },
  ];
}

// Language phrase sets mapped by language group
const languagePhraseSets = {
  arabic: [
    { english: "Hello", local: "السلام عليكم (As-salamu alaykum)", pronunciation: "ahs-sah-lah-moo ah-lay-koom" },
    { english: "Thank you", local: "شكرا (Shukran)", pronunciation: "shoo-krahn" },
    { english: "Please", local: "من فضلك (Min fadlak)", pronunciation: "min fahd-lahk" },
    { english: "Excuse me", local: "لو سمحت (Law samaht)", pronunciation: "law sah-maht" },
    { english: "Goodbye", local: "مع السلامة (Ma'a salama)", pronunciation: "mah-ah sah-lah-mah" },
    { english: "How much?", local: "بكم؟ (Bikam?)", pronunciation: "bee-kahm" },
    { english: "Yes", local: "نعم (Na'am)", pronunciation: "nah-ahm" },
    { english: "No", local: "لا (La)", pronunciation: "lah" },
    { english: "Help", local: "مساعدة! (Musa'da!)", pronunciation: "moo-sah-dah" },
    { english: "Where is...?", local: "أين...؟ (Ayna...?)", pronunciation: "ay-nah" },
  ],
  french: [
    { english: "Hello", local: "Bonjour", pronunciation: "bohn-zhoor" },
    { english: "Thank you", local: "Merci", pronunciation: "mehr-see" },
    { english: "Please", local: "S'il vous plaît", pronunciation: "seel voo pleh" },
    { english: "Excuse me", local: "Excusez-moi", pronunciation: "ex-koo-zay mwah" },
    { english: "Goodbye", local: "Au revoir", pronunciation: "oh reh-vwahr" },
    { english: "How much?", local: "Combien?", pronunciation: "kohm-bee-ehn" },
    { english: "Yes", local: "Oui", pronunciation: "wee" },
    { english: "No", local: "Non", pronunciation: "nohn" },
    { english: "Help", local: "Au secours!", pronunciation: "oh suh-koor" },
    { english: "Where is...?", local: "Où est...?", pronunciation: "oo eh" },
  ],
  spanish: [
    { english: "Hello", local: "Hola", pronunciation: "oh-lah" },
    { english: "Thank you", local: "Gracias", pronunciation: "grah-see-ahs" },
    { english: "Please", local: "Por favor", pronunciation: "pohr fah-vohr" },
    { english: "Excuse me", local: "Disculpe", pronunciation: "dees-kool-peh" },
    { english: "Goodbye", local: "Adiós", pronunciation: "ah-dee-ohs" },
    { english: "How much?", local: "¿Cuánto cuesta?", pronunciation: "kwahn-toh kwes-tah" },
    { english: "Yes", local: "Sí", pronunciation: "see" },
    { english: "No", local: "No", pronunciation: "noh" },
    { english: "Help", local: "¡Ayuda!", pronunciation: "ah-yoo-dah" },
    { english: "Where is...?", local: "¿Dónde está...?", pronunciation: "dohn-deh es-tah" },
  ],
  portuguese: [
    { english: "Hello", local: "Olá", pronunciation: "oh-lah" },
    { english: "Thank you", local: "Obrigado/Obrigada", pronunciation: "oh-bree-gah-doo / oh-bree-gah-dah" },
    { english: "Please", local: "Por favor", pronunciation: "pohr fah-vohr" },
    { english: "Excuse me", local: "Com licença", pronunciation: "kohm lee-sen-sah" },
    { english: "Goodbye", local: "Adeus", pronunciation: "ah-day-oosh" },
    { english: "How much?", local: "Quanto custa?", pronunciation: "kwahn-too koos-tah" },
    { english: "Yes", local: "Sim", pronunciation: "seem" },
    { english: "No", local: "Não", pronunciation: "now" },
    { english: "Help", local: "Socorro!", pronunciation: "soh-koh-hoo" },
    { english: "Where is...?", local: "Onde fica...?", pronunciation: "ohn-jee fee-kah" },
  ],
  swahili: [
    { english: "Hello", local: "Habari / Jambo", pronunciation: "hah-bah-ree / jahm-boh" },
    { english: "Thank you", local: "Asante", pronunciation: "ah-sahn-teh" },
    { english: "Please", local: "Tafadhali", pronunciation: "tah-fah-dah-lee" },
    { english: "Excuse me", local: "Samahani", pronunciation: "sah-mah-hah-nee" },
    { english: "Goodbye", local: "Kwaheri", pronunciation: "kwah-heh-ree" },
    { english: "How much?", local: "Bei gani?", pronunciation: "bay gah-nee" },
    { english: "Yes", local: "Ndiyo", pronunciation: "nn-dee-yoh" },
    { english: "No", local: "Hapana", pronunciation: "hah-pah-nah" },
    { english: "Help", local: "Msaada!", pronunciation: "mm-sah-dah" },
    { english: "Where is...?", local: "...iko wapi?", pronunciation: "ee-koh wah-pee" },
  ],
  amharic: [
    { english: "Hello", local: "ሰላም (Selam)", pronunciation: "seh-lahm" },
    { english: "Thank you", local: "አመሰግናለሁ (Ameseginalehu)", pronunciation: "ah-meh-seg-nah-leh-hoo" },
    { english: "Please", local: "እባክህ (Ebakeh)", pronunciation: "eh-bah-keh" },
    { english: "Excuse me", local: "ይቅርታ (Yikirta)", pronunciation: "yih-kir-tah" },
    { english: "Goodbye", local: "ደህና ሁን (Dehna hun)", pronunciation: "deh-nah hoon" },
    { english: "How much?", local: "ስንት ነው? (Sint new?)", pronunciation: "sinnt neh-oo" },
    { english: "Yes", local: "አዎ (Awo)", pronunciation: "ah-woh" },
    { english: "No", local: "አይ (Ay)", pronunciation: "eye" },
    { english: "Help", local: "እርዳታ! (Irdata!)", pronunciation: "ir-dah-tah" },
    { english: "Where is...?", local: "...የት ነው? (Yet new?)", pronunciation: "yeht neh-oo" },
  ],
  bengali: [
    { english: "Hello", local: "নমস্কার (Nomoshkar)", pronunciation: "noh-mosh-kar" },
    { english: "Thank you", local: "ধন্যবাদ (Dhonnobad)", pronunciation: "dhon-noh-bahd" },
    { english: "Please", local: "দয়া করে (Doya kore)", pronunciation: "doy-ah koh-reh" },
    { english: "Excuse me", local: "মাফ করবেন (Maph korben)", pronunciation: "mahf kor-ben" },
    { english: "Goodbye", local: "বিদায় (Biday)", pronunciation: "bee-die" },
    { english: "How much?", local: "কত? (Koto?)", pronunciation: "koh-toh" },
    { english: "Yes", local: "হ্যাঁ (Hyan)", pronunciation: "hyah" },
    { english: "No", local: "না (Na)", pronunciation: "nah" },
    { english: "Help", local: "সাহায্য! (Sahajjo!)", pronunciation: "shah-haj-joh" },
    { english: "Where is...?", local: "...কোথায়? (Kothay?)", pronunciation: "koh-thay" },
  ],
  urdu: [
    { english: "Hello", local: "السلام علیکم (Assalamu Alaikum)", pronunciation: "ahs-sah-lah-moo ah-lay-koom" },
    { english: "Thank you", local: "شکریہ (Shukriya)", pronunciation: "shoo-kree-yah" },
    { english: "Please", local: "براہ کرم (Barah-e-karam)", pronunciation: "bah-rah-eh kah-rahm" },
    { english: "Excuse me", local: "معاف کیجیے (Maaf kijiye)", pronunciation: "maaf kee-jee-yay" },
    { english: "Goodbye", local: "خدا حافظ (Khuda Hafiz)", pronunciation: "khoo-dah hah-fiz" },
    { english: "How much?", local: "کتنا ہے؟ (Kitna hai?)", pronunciation: "kit-nah hai" },
    { english: "Yes", local: "جی ہاں (Ji haan)", pronunciation: "jee haan" },
    { english: "No", local: "نہیں (Nahin)", pronunciation: "nah-heen" },
    { english: "Help", local: "!مدد (Madad!)", pronunciation: "muh-dud" },
    { english: "Where is...?", local: "...کہاں ہے؟ (Kahan hai?)", pronunciation: "kah-haan hai" },
  ],
  persian: [
    { english: "Hello", local: "سلام (Salaam)", pronunciation: "sah-lahm" },
    { english: "Thank you", local: "ممنون (Mamnoon)", pronunciation: "mahm-noon" },
    { english: "Please", local: "لطفاً (Lotfan)", pronunciation: "lot-fahn" },
    { english: "Excuse me", local: "ببخشید (Bebakhshid)", pronunciation: "beh-bakh-sheed" },
    { english: "Goodbye", local: "خداحافظ (Khodahafez)", pronunciation: "khoh-dah-hah-fez" },
    { english: "How much?", local: "چند؟ (Chand?)", pronunciation: "chahnd" },
    { english: "Yes", local: "بله (Baleh)", pronunciation: "bah-leh" },
    { english: "No", local: "نه (Na)", pronunciation: "nah" },
    { english: "Help", local: "!کمک (Komak!)", pronunciation: "koh-mahk" },
    { english: "Where is...?", local: "...کجاست؟ (Kojast?)", pronunciation: "koh-jahst" },
  ],
  romanian: [
    { english: "Hello", local: "Bună ziua", pronunciation: "boo-nah zee-wah" },
    { english: "Thank you", local: "Mulțumesc", pronunciation: "moolt-soo-mesk" },
    { english: "Please", local: "Vă rog", pronunciation: "vah rohg" },
    { english: "Excuse me", local: "Scuzați-mă", pronunciation: "skoo-zaht-see mah" },
    { english: "Goodbye", local: "La revedere", pronunciation: "lah reh-veh-deh-reh" },
    { english: "How much?", local: "Cât costă?", pronunciation: "kuht koh-stah" },
    { english: "Yes", local: "Da", pronunciation: "dah" },
    { english: "No", local: "Nu", pronunciation: "noo" },
    { english: "Help", local: "Ajutor!", pronunciation: "ah-zhoo-tohr" },
    { english: "Where is...?", local: "Unde este...?", pronunciation: "oon-deh yes-teh" },
  ],
  ukrainian: [
    { english: "Hello", local: "Привіт (Pryvit)", pronunciation: "prih-veet" },
    { english: "Thank you", local: "Дякую (Dyakuyu)", pronunciation: "dyah-koo-yoo" },
    { english: "Please", local: "Будь ласка (Bud laska)", pronunciation: "bood lahs-kah" },
    { english: "Excuse me", local: "Вибачте (Vybachte)", pronunciation: "vih-bahch-teh" },
    { english: "Goodbye", local: "До побачення (Do pobachennya)", pronunciation: "doh poh-bah-chen-nyah" },
    { english: "How much?", local: "Скільки коштує? (Skilky koshtuye?)", pronunciation: "skeel-kih kosh-too-yeh" },
    { english: "Yes", local: "Так (Tak)", pronunciation: "tahk" },
    { english: "No", local: "Ні (Ni)", pronunciation: "nee" },
    { english: "Help", local: "Допоможіть! (Dopomozhit!)", pronunciation: "doh-poh-moh-zheet" },
    { english: "Where is...?", local: "Де...? (De...?)", pronunciation: "deh" },
  ],
  finnish: [
    { english: "Hello", local: "Hei / Moi", pronunciation: "hey / moy" },
    { english: "Thank you", local: "Kiitos", pronunciation: "kee-tohs" },
    { english: "Please", local: "Ole hyvä", pronunciation: "oh-leh hoo-vah" },
    { english: "Excuse me", local: "Anteeksi", pronunciation: "ahn-teek-see" },
    { english: "Goodbye", local: "Näkemiin", pronunciation: "nah-keh-meen" },
    { english: "How much?", local: "Paljonko maksaa?", pronunciation: "pahl-yohn-koh mahk-sah" },
    { english: "Yes", local: "Kyllä", pronunciation: "kuul-lah" },
    { english: "No", local: "Ei", pronunciation: "ay" },
    { english: "Help", local: "Apua!", pronunciation: "ah-poo-ah" },
    { english: "Where is...?", local: "Missä on...?", pronunciation: "mis-sah on" },
  ],
  icelandic: [
    { english: "Hello", local: "Halló / Góðan daginn", pronunciation: "hah-loh / go-than die-in" },
    { english: "Thank you", local: "Takk", pronunciation: "tahk" },
    { english: "Please", local: "Gjörðu svo vel", pronunciation: "gyur-thoo svoh vel" },
    { english: "Excuse me", local: "Afsakið", pronunciation: "ahf-sah-kith" },
    { english: "Goodbye", local: "Bless", pronunciation: "bless" },
    { english: "How much?", local: "Hvað kostar?", pronunciation: "kvath koh-star" },
    { english: "Yes", local: "Já", pronunciation: "yow" },
    { english: "No", local: "Nei", pronunciation: "nay" },
    { english: "Help", local: "Hjálp!", pronunciation: "hyowlp" },
    { english: "Where is...?", local: "Hvar er...?", pronunciation: "kvahr air" },
  ],
  albanian: [
    { english: "Hello", local: "Përshëndetje", pronunciation: "puhr-shuhn-det-yeh" },
    { english: "Thank you", local: "Faleminderit", pronunciation: "fah-leh-min-deh-reet" },
    { english: "Please", local: "Ju lutem", pronunciation: "yoo loo-tem" },
    { english: "Excuse me", local: "Më falni", pronunciation: "muh fahl-nee" },
    { english: "Goodbye", local: "Mirupafshim", pronunciation: "meer-oo-paf-sheem" },
    { english: "How much?", local: "Sa kushton?", pronunciation: "sah koosh-ton" },
    { english: "Yes", local: "Po", pronunciation: "poh" },
    { english: "No", local: "Jo", pronunciation: "yoh" },
    { english: "Help", local: "Ndihmë!", pronunciation: "ndee-muh" },
    { english: "Where is...?", local: "Ku është...?", pronunciation: "koo uhsh-tuh" },
  ],
  georgian: [
    { english: "Hello", local: "გამარჯობა (Gamarjoba)", pronunciation: "gah-mahr-joh-bah" },
    { english: "Thank you", local: "მადლობა (Madloba)", pronunciation: "mahd-loh-bah" },
    { english: "Please", local: "თუ შეიძლება (Tu sheizleba)", pronunciation: "too shay-iz-leh-bah" },
    { english: "Excuse me", local: "უკაცრავად (Ukatsravad)", pronunciation: "oo-kahts-rah-vahd" },
    { english: "Goodbye", local: "ნახვამდის (Nakhvamdis)", pronunciation: "nahkh-vahm-dees" },
    { english: "How much?", local: "რა ღირს? (Ra ghirs?)", pronunciation: "rah gheers" },
    { english: "Yes", local: "კი (Ki)", pronunciation: "kee" },
    { english: "No", local: "არა (Ara)", pronunciation: "ah-rah" },
    { english: "Help", local: "დახმარება! (Dakhmareba!)", pronunciation: "dahkh-mah-reh-bah" },
    { english: "Where is...?", local: "სად არის...? (Sad aris...?)", pronunciation: "sahd ah-rees" },
  ],
  serbian: [
    { english: "Hello", local: "Здраво (Zdravo)", pronunciation: "zdrah-voh" },
    { english: "Thank you", local: "Хвала (Hvala)", pronunciation: "hvah-lah" },
    { english: "Please", local: "Молим (Molim)", pronunciation: "moh-leem" },
    { english: "Excuse me", local: "Извините (Izvinite)", pronunciation: "eez-vee-nee-teh" },
    { english: "Goodbye", local: "Довиђења (Doviđenja)", pronunciation: "doh-vee-jen-yah" },
    { english: "How much?", local: "Колико кошта? (Koliko košta?)", pronunciation: "koh-lee-koh koh-shtah" },
    { english: "Yes", local: "Да (Da)", pronunciation: "dah" },
    { english: "No", local: "Не (Ne)", pronunciation: "neh" },
    { english: "Help", local: "Помоћ! (Pomoć!)", pronunciation: "poh-mohch" },
    { english: "Where is...?", local: "Где је...? (Gde je...?)", pronunciation: "gdeh yeh" },
  ],
  bulgarian: [
    { english: "Hello", local: "Здравейте (Zdraveyte)", pronunciation: "zdrah-vey-teh" },
    { english: "Thank you", local: "Благодаря (Blagodarya)", pronunciation: "blah-goh-dah-ryah" },
    { english: "Please", local: "Моля (Molya)", pronunciation: "moh-lyah" },
    { english: "Excuse me", local: "Извинете (Izvinete)", pronunciation: "eez-vee-neh-teh" },
    { english: "Goodbye", local: "Довиждане (Dovizhdane)", pronunciation: "doh-veezh-dah-neh" },
    { english: "How much?", local: "Колко струва? (Kolko struva?)", pronunciation: "kohl-koh stroo-vah" },
    { english: "Yes", local: "Да (Da)", pronunciation: "dah" },
    { english: "No", local: "Не (Ne)", pronunciation: "neh" },
    { english: "Help", local: "Помощ! (Pomosht!)", pronunciation: "poh-mosht" },
    { english: "Where is...?", local: "Къде е...? (Kude e...?)", pronunciation: "kuh-deh eh" },
  ],
  mongolian: [
    { english: "Hello", local: "Сайн байна уу (Sain baina uu)", pronunciation: "sine buy-nah oo" },
    { english: "Thank you", local: "Баярлалаа (Bayarlalaa)", pronunciation: "buy-ar-lah-lah" },
    { english: "Please", local: "Гуйя (Guiya)", pronunciation: "goo-yah" },
    { english: "Excuse me", local: "Уучлаарай (Uuchlaarai)", pronunciation: "ooch-lah-rye" },
    { english: "Goodbye", local: "Баяртай (Bayartai)", pronunciation: "buy-ar-tie" },
    { english: "How much?", local: "Хэд вэ? (Hed ve?)", pronunciation: "hed veh" },
    { english: "Yes", local: "Тийм (Tiim)", pronunciation: "teem" },
    { english: "No", local: "Үгүй (Ugui)", pronunciation: "oo-goo-ee" },
    { english: "Help", local: "Тусламж! (Tuslamj!)", pronunciation: "toos-lahmj" },
    { english: "Where is...?", local: "...хаана байна? (Khaana baina?)", pronunciation: "hah-nah buy-nah" },
  ],
  lao: [
    { english: "Hello", local: "ສະບາຍດີ (Sabaidi)", pronunciation: "sah-bye-dee" },
    { english: "Thank you", local: "ຂອບໃຈ (Khob chai)", pronunciation: "kohp jai" },
    { english: "Please", local: "ກະລຸນາ (Kaluna)", pronunciation: "gah-loo-nah" },
    { english: "Excuse me", local: "ຂໍໂທດ (Kho thot)", pronunciation: "kaw toht" },
    { english: "Goodbye", local: "ລາກ່ອນ (La kon)", pronunciation: "lah gohn" },
    { english: "How much?", local: "ເທົ່າໃດ? (Thao dai?)", pronunciation: "tao dai" },
    { english: "Yes", local: "ແມ່ນ (Maen)", pronunciation: "mehn" },
    { english: "No", local: "ບໍ່ (Bo)", pronunciation: "baw" },
    { english: "Help", local: "ຊ່ວຍແດ່! (Suay dae!)", pronunciation: "soo-ay deh" },
    { english: "Where is...?", local: "...ຢູ່ໃສ? (Yu sai?)", pronunciation: "yoo sai" },
  ],
  burmese: [
    { english: "Hello", local: "မင်္ဂလာပါ (Mingalaba)", pronunciation: "min-gah-lah-bah" },
    { english: "Thank you", local: "ကျေးဇူးတင်ပါတယ် (Kyei zu tin ba de)", pronunciation: "chay-zoo tin bah deh" },
    { english: "Please", local: "ကျေးဇူးပြု၍ (Kyei zu pyu.)", pronunciation: "chay-zoo pyoo" },
    { english: "Excuse me", local: "ခွင့်ပြုပါ (Khwint pyu ba)", pronunciation: "khwin pyoo bah" },
    { english: "Goodbye", local: "သွားတော့မယ် (Thwa daw meh)", pronunciation: "thwah daw meh" },
    { english: "How much?", local: "ဘယ်လောက်လဲ (Beh lout leh?)", pronunciation: "beh lout leh" },
    { english: "Yes", local: "ဟုတ်ကဲ့ (Hoke keh)", pronunciation: "hohk keh" },
    { english: "No", local: "မဟုတ်ဘူး (Ma hoke bu)", pronunciation: "mah hohk boo" },
    { english: "Help", local: "ကူညီပါ! (Ku nyi ba!)", pronunciation: "koo nyee bah" },
    { english: "Where is...?", local: "...ဘယ်မှာလဲ (Beh hma leh?)", pronunciation: "beh hmah leh" },
  ],
  malay: [
    { english: "Hello", local: "Selamat / Hai", pronunciation: "seh-lah-maht / hai" },
    { english: "Thank you", local: "Terima kasih", pronunciation: "teh-ree-mah kah-see" },
    { english: "Please", local: "Tolong / Sila", pronunciation: "toh-long / see-lah" },
    { english: "Excuse me", local: "Maafkan saya", pronunciation: "mah-ahf-kahn sah-yah" },
    { english: "Goodbye", local: "Selamat tinggal", pronunciation: "seh-lah-maht ting-gahl" },
    { english: "How much?", local: "Berapa?", pronunciation: "beh-rah-pah" },
    { english: "Yes", local: "Ya", pronunciation: "yah" },
    { english: "No", local: "Tidak", pronunciation: "tee-dahk" },
    { english: "Help", local: "Tolong!", pronunciation: "toh-long" },
    { english: "Where is...?", local: "Di mana...?", pronunciation: "dee mah-nah" },
  ],
};

// Map countries to their primary language group for phrase fallback
const countryLanguageGroup = {
  // Arabic-speaking
  algeria: 'arabic', bahrain: 'arabic', chad: 'arabic', comoros: 'arabic', djibouti: 'arabic',
  iraq: 'arabic', kuwait: 'arabic', lebanon: 'arabic', libya: 'arabic', mauritania: 'arabic',
  oman: 'arabic', qatar: 'arabic', somalia: 'arabic', sudan: 'arabic', 'south sudan': 'arabic',
  tunisia: 'arabic', yemen: 'arabic',
  // French-speaking
  belgium: 'french', benin: 'french', 'burkina faso': 'french', burundi: 'french',
  cameroon: 'french', 'central african republic': 'french', 'congo': 'french',
  'congo (brazzaville)': 'french', 'congo (kinshasa)': 'french',
  'democratic republic of the congo': 'french', "cote d'ivoire": 'french',
  'equatorial guinea': 'french', gabon: 'french', guinea: 'french', haiti: 'french',
  luxembourg: 'french', madagascar: 'french', mali: 'french', monaco: 'french',
  niger: 'french', rwanda: 'french', senegal: 'french', seychelles: 'french', togo: 'french',
  // Spanish-speaking
  bolivia: 'spanish', chile: 'spanish', 'costa rica': 'spanish',
  'dominican republic': 'spanish', ecuador: 'spanish', 'el salvador': 'spanish',
  guatemala: 'spanish', honduras: 'spanish', nicaragua: 'spanish', panama: 'spanish',
  paraguay: 'spanish', uruguay: 'spanish', venezuela: 'spanish',
  // Portuguese-speaking
  angola: 'portuguese', 'cape verde': 'portuguese', 'guinea-bissau': 'portuguese',
  mozambique: 'portuguese', 'sao tome and principe': 'portuguese', 'timor-leste': 'portuguese',
  // Swahili-speaking
  kenya: 'swahili', tanzania: 'swahili', uganda: 'swahili',
  // Other languages
  ethiopia: 'amharic', bangladesh: 'bengali', pakistan: 'urdu',
  iran: 'persian', afghanistan: 'persian',
  romania: 'romanian', moldova: 'romanian',
  ukraine: 'ukrainian', finland: 'finnish', iceland: 'icelandic',
  albania: 'albanian', kosovo: 'albanian',
  georgia: 'georgian',
  serbia: 'serbian', 'bosnia and herzegovina': 'serbian',
  bulgaria: 'bulgarian', 'north macedonia': 'bulgarian',
  mongolia: 'mongolian', laos: 'lao', myanmar: 'burmese', brunei: 'malay',
};

// Income-tier pricing for countries without specific price data
const incomeTierPricing = {
  low: { hotel: "$10-40 per night", meal: "$1-5", streetFood: "$0.50-2", coffee: "$0.50-1.50", transport: "$0.25-1", taxi: "$0.50-2 per km" },
  lowerMiddle: { hotel: "$20-70 per night", meal: "$3-10", streetFood: "$1-3", coffee: "$1-2", transport: "$0.50-2", taxi: "$1-3 per km" },
  upperMiddle: { hotel: "$40-150 per night", meal: "$5-20", streetFood: "$2-6", coffee: "$2-4", transport: "$1-3", taxi: "$2-4 per km" },
  high: { hotel: "$80-300 per night", meal: "$15-40", streetFood: "$5-12", coffee: "$3-6", transport: "$2-5", taxi: "$3-6 per km" },
};

const countryIncomeTier = {
  // Low income
  afghanistan: 'low', benin: 'low', 'burkina faso': 'low', burundi: 'low',
  'central african republic': 'low', chad: 'low', comoros: 'low', congo: 'low',
  'congo (brazzaville)': 'low', 'congo (kinshasa)': 'low',
  'democratic republic of the congo': 'low', eritrea: 'low', ethiopia: 'low',
  gambia: 'low', guinea: 'low', 'guinea-bissau': 'low', haiti: 'low',
  lesotho: 'low', liberia: 'low', madagascar: 'low', malawi: 'low', mali: 'low',
  mauritania: 'low', mozambique: 'low', myanmar: 'low', nepal: 'low', niger: 'low',
  rwanda: 'low', 'sao tome and principe': 'low', senegal: 'low',
  'sierra leone': 'low', somalia: 'low', 'south sudan': 'low', sudan: 'low',
  tajikistan: 'low', togo: 'low', uganda: 'low', yemen: 'low', zimbabwe: 'low',
  // Lower middle income
  algeria: 'lowerMiddle', angola: 'lowerMiddle', bangladesh: 'lowerMiddle',
  belize: 'lowerMiddle', bhutan: 'lowerMiddle', bolivia: 'lowerMiddle',
  cambodia: 'lowerMiddle', cameroon: 'lowerMiddle', 'cape verde': 'lowerMiddle',
  "cote d'ivoire": 'lowerMiddle', djibouti: 'lowerMiddle',
  'dominican republic': 'lowerMiddle', ecuador: 'lowerMiddle', egypt: 'lowerMiddle',
  'el salvador': 'lowerMiddle', eswatini: 'lowerMiddle', fiji: 'lowerMiddle',
  gabon: 'lowerMiddle', ghana: 'lowerMiddle', guatemala: 'lowerMiddle',
  guyana: 'lowerMiddle', honduras: 'lowerMiddle', india: 'lowerMiddle',
  indonesia: 'lowerMiddle', iran: 'lowerMiddle', iraq: 'lowerMiddle',
  jamaica: 'lowerMiddle', jordan: 'lowerMiddle', kenya: 'lowerMiddle',
  kyrgyzstan: 'lowerMiddle', laos: 'lowerMiddle', lebanon: 'lowerMiddle',
  libya: 'lowerMiddle', mongolia: 'lowerMiddle', morocco: 'lowerMiddle',
  namibia: 'lowerMiddle', nicaragua: 'lowerMiddle', nigeria: 'lowerMiddle',
  pakistan: 'lowerMiddle', 'papua new guinea': 'lowerMiddle', paraguay: 'lowerMiddle',
  philippines: 'lowerMiddle', 'solomon islands': 'lowerMiddle',
  'sri lanka': 'lowerMiddle', suriname: 'lowerMiddle', tanzania: 'lowerMiddle',
  'timor-leste': 'lowerMiddle', tunisia: 'lowerMiddle', uzbekistan: 'lowerMiddle',
  vanuatu: 'lowerMiddle', vietnam: 'lowerMiddle', zambia: 'lowerMiddle',
  // Upper middle income
  albania: 'upperMiddle', argentina: 'upperMiddle', armenia: 'upperMiddle',
  azerbaijan: 'upperMiddle', barbados: 'upperMiddle', belarus: 'upperMiddle',
  'bosnia and herzegovina': 'upperMiddle', botswana: 'upperMiddle',
  brazil: 'upperMiddle', bulgaria: 'upperMiddle', chile: 'upperMiddle',
  china: 'upperMiddle', colombia: 'upperMiddle', 'costa rica': 'upperMiddle',
  croatia: 'upperMiddle', cuba: 'upperMiddle', 'dominican republic': 'upperMiddle',
  'equatorial guinea': 'upperMiddle', georgia: 'upperMiddle', grenada: 'upperMiddle',
  hungary: 'upperMiddle', kazakhstan: 'upperMiddle', malaysia: 'upperMiddle',
  maldives: 'upperMiddle', mauritius: 'upperMiddle', mexico: 'upperMiddle',
  moldova: 'upperMiddle', montenegro: 'upperMiddle', 'north macedonia': 'upperMiddle',
  panama: 'upperMiddle', peru: 'upperMiddle', romania: 'upperMiddle',
  russia: 'upperMiddle', serbia: 'upperMiddle', 'south africa': 'upperMiddle',
  thailand: 'upperMiddle', turkey: 'upperMiddle', turkmenistan: 'upperMiddle',
  ukraine: 'upperMiddle', uruguay: 'upperMiddle', venezuela: 'upperMiddle',
  // High income
  andorra: 'high', australia: 'high', austria: 'high', bahamas: 'high',
  bahrain: 'high', belgium: 'high', brunei: 'high', canada: 'high',
  cyprus: 'high', 'czech republic': 'high', czechia: 'high', denmark: 'high',
  estonia: 'high', finland: 'high', france: 'high', germany: 'high',
  greece: 'high', iceland: 'high', ireland: 'high', israel: 'high',
  italy: 'high', japan: 'high', 'south korea': 'high', 'korea (republic of)': 'high',
  kuwait: 'high', latvia: 'high', liechtenstein: 'high', lithuania: 'high',
  luxembourg: 'high', malta: 'high', monaco: 'high', netherlands: 'high',
  'new zealand': 'high', norway: 'high', oman: 'high', poland: 'high',
  portugal: 'high', qatar: 'high', 'saudi arabia': 'high', seychelles: 'high',
  singapore: 'high', slovakia: 'high', slovenia: 'high', spain: 'high',
  sweden: 'high', switzerland: 'high', 'trinidad and tobago': 'high',
  'united arab emirates': 'high', 'united kingdom': 'high', 'united states': 'high',
};

function getPhrasesData(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  if (knownPhrasesData[keyedName]) return knownPhrasesData[keyedName];

  // Try language group fallback
  const langGroup = countryLanguageGroup[keyedName] || countryLanguageGroup[normalizedName];
  if (langGroup && languagePhraseSets[langGroup]) return languagePhraseSets[langGroup];

  return [
    { english: "Hello", local: "Hello", pronunciation: "Regional greeting" },
    { english: "Thank you", local: "Thank you", pronunciation: "Regional phrase" },
    { english: "Please", local: "Please", pronunciation: "Regional phrase" },
    { english: "Excuse me", local: "Excuse me", pronunciation: "Regional phrase" },
    { english: "Goodbye", local: "Goodbye", pronunciation: "Regional phrase" },
    { english: "How much?", local: "How much?", pronunciation: "Regional phrase" },
    { english: "Yes", local: "Yes", pronunciation: "Regional phrase" },
    { english: "No", local: "No", pronunciation: "Regional phrase" },
    { english: "Help", local: "Help", pronunciation: "Regional phrase" },
    { english: "Where is...?", local: "Where is...?", pronunciation: "Regional phrase" },
  ];
}

function getPricesData(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  if (knownPricesData[keyedName]) return knownPricesData[keyedName];

  // Use income tier pricing
  const tier = countryIncomeTier[keyedName] || countryIncomeTier[normalizedName];
  if (tier && incomeTierPricing[tier]) return incomeTierPricing[tier];

  return { hotel: "$30-100 per night", meal: "$5-25", streetFood: "$1-5", coffee: "$1-3", transport: "$0.50-3", taxi: "$1-5 per km" };
}

function getBestTimeToVisitData(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  if (knownBestTimeToVisitData[keyedName]) return knownBestTimeToVisitData[keyedName];

  // Generate from climate data
  const geo = knownGeographyData[keyedName] || knownGeographyData[normalizedName];
  if (geo && geo.climate) {
    const cl = geo.climate.toLowerCase();
    if (cl.includes('tropical') || cl.includes('monsoon')) {
      return { bestMonths: "November to March (dry season, cooler temperatures ideal for travel).", rainySeason: "May to October (monsoon/wet season with heavy rainfall).", cheapestSeason: "May to September (wet season means fewer tourists and lower prices).", majorFestivals: ["Local cultural festivals", "National independence celebrations", "Religious holidays"] };
    }
    if (cl.includes('desert') || cl.includes('arid')) {
      return { bestMonths: "October to April (cooler temperatures, comfortable for outdoor exploration).", rainySeason: "Minimal rainfall year-round in most desert regions.", cheapestSeason: "May to September (extreme heat deters visitors, lower prices).", majorFestivals: ["Local cultural festivals", "Religious occasions", "National celebrations"] };
    }
    if (cl.includes('mediterranean')) {
      return { bestMonths: "April to June and September to October (warm weather, fewer crowds).", rainySeason: "November to March (cooler, wetter months).", cheapestSeason: "November to March (off-season with lower prices and fewer tourists).", majorFestivals: ["National holidays", "Local cultural events", "Summer festivals"] };
    }
    if (cl.includes('continental') || cl.includes('temperate')) {
      return { bestMonths: "May to September (warm summer months with long daylight hours).", rainySeason: "Year-round moderate rainfall, heavier in spring and autumn.", cheapestSeason: "November to March (cold winter months offer lower prices).", majorFestivals: ["National celebrations", "Cultural festivals", "Seasonal events"] };
    }
    if (cl.includes('arctic') || cl.includes('subarctic') || cl.includes('cold')) {
      return { bestMonths: "June to August (midnight sun, warmest temperatures for sightseeing).", rainySeason: "September to November (wettest period in most subarctic regions).", cheapestSeason: "October to April (dark, cold winter — except Christmas/New Year holidays).", majorFestivals: ["Northern Lights season (winter)", "Midsummer celebrations", "National holidays"] };
    }
  }

  return { bestMonths: "Spring and Autumn offer the most comfortable weather for travel.", rainySeason: "Varies by region — check local conditions before traveling.", cheapestSeason: "Off-peak months typically offer the best deals on accommodation.", majorFestivals: ["Local cultural festivals", "National holidays"] };
}

function getFunFactsData(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  if (knownFunFactsData[keyedName]) return knownFunFactsData[keyedName];

  // Generate facts from geography data
  const geo = knownGeographyData[keyedName] || knownGeographyData[normalizedName];
  const facts = [];
  if (geo) {
    if (geo.majorCities) facts.push(`${countryName}'s major cities include ${geo.majorCities.slice(0, 3).join(', ')}`);
    if (geo.climate) facts.push(`${countryName} has a ${geo.climate.split('.')[0].toLowerCase().replace(/^\w/, c => c.toUpperCase())} climate`);
    if (geo.landscape) facts.push(`The landscape of ${countryName} features ${geo.landscape.split('.')[0].toLowerCase()}`);
    if (geo.naturalLandmarks) facts.push(`Notable landmarks include ${geo.naturalLandmarks.slice(0, 3).join(', ')}`);
  }
  while (facts.length < 5) {
    const extras = [
      `${countryName} has a rich history and cultural heritage`,
      `${countryName} is known for its unique traditions and customs`,
      `${countryName} offers diverse landscapes and natural beauty`,
      `${countryName} has a distinctive culinary tradition worth experiencing`,
      `${countryName} is home to notable historical and cultural sites`,
    ];
    facts.push(extras[facts.length] || `${countryName} welcomes visitors with its unique character`);
  }
  return facts.slice(0, 5);
}

const knownMapCategoryData = {
  nepal: {
    bestFoodAreas: ['Thamel, Kathmandu', 'Jhamsikhel, Lalitpur', 'Lakeside, Pokhara', 'Durbar Marg, Kathmandu', 'Boudha, Kathmandu'],
    nightlifeZones: ['Thamel, Kathmandu', 'Durbarmarg, Kathmandu', 'Jhamsikhel, Lalitpur', 'Lakeside, Pokhara'],
    instagrammableSpots: ['Boudhanath Stupa, Kathmandu', 'Phewa Lake, Pokhara', 'Nagarkot Viewpoint', 'Swayambhunath Temple, Kathmandu', 'Patan Durbar Square'],
    areasToAvoid: ['Terai border regions at night', 'Remote trails without a guide', 'Isolated areas of Kathmandu late at night'],
  },
  japan: {
    bestFoodAreas: ['Tsukiji Outer Market, Tokyo', 'Dotonbori, Osaka', 'Nishiki Market, Kyoto', 'Shinjuku Omoide Yokocho, Tokyo', 'Nakasu, Fukuoka'],
    nightlifeZones: ['Shibuya, Tokyo', 'Shinjuku Kabukicho, Tokyo', 'Dotonbori, Osaka', 'Pontocho, Kyoto', 'Roppongi, Tokyo'],
    instagrammableSpots: ['Fushimi Inari Shrine, Kyoto', 'Shibuya Crossing, Tokyo', 'Arashiyama Bamboo Grove, Kyoto', 'Mount Fuji from Lake Kawaguchi', 'Senso-ji Temple, Tokyo'],
    areasToAvoid: ['Kabukicho late night (touts), Tokyo', 'Roppongi (unlicensed bars), Tokyo'],
  },
  france: {
    bestFoodAreas: ['Le Marais, Paris', 'Vieux Lyon, Lyon', 'Rue Saint-Jean, Lyon', 'Cours Saleya Market, Nice', 'Saint-Germain-des-Prés, Paris'],
    nightlifeZones: ['Oberkampf, Paris', 'Pigalle, Paris', 'Vieux Port, Marseille', 'Place de la Comédie, Montpellier', 'Cours Julien, Marseille'],
    instagrammableSpots: ['Eiffel Tower, Paris', 'Mont Saint-Michel, Normandy', 'Lavender Fields, Provence', 'Château de Chambord, Loire Valley', 'Étretat Cliffs, Normandy'],
    areasToAvoid: ['Gare du Nord area at night, Paris', 'Les Halles late night, Paris', 'Northern suburbs of Marseille'],
  },
  'united states': {
    bestFoodAreas: ['French Quarter, New Orleans', 'Mission District, San Francisco', 'Koreatown, Los Angeles', 'East Village, New York', 'Pilsen, Chicago'],
    nightlifeZones: ['Times Square, New York', 'South Beach, Miami', 'Bourbon Street, New Orleans', 'Sunset Strip, Los Angeles', 'Wicker Park, Chicago'],
    instagrammableSpots: ['Golden Gate Bridge, San Francisco', 'Grand Canyon, Arizona', 'Antelope Canyon, Arizona', 'Brooklyn Bridge, New York', 'Horseshoe Bend, Arizona'],
    areasToAvoid: ['Skid Row, Los Angeles', 'Tenderloin, San Francisco', 'West Garfield Park, Chicago', 'Parts of East St. Louis'],
    bestBeaches: ['Waikiki Beach, Hawaii', 'South Beach, Miami', 'Malibu Beach, California', 'Outer Banks, North Carolina', 'Clearwater Beach, Florida'],
  },
  brazil: {
    bestFoodAreas: ['Vila Madalena, São Paulo', 'Santa Teresa, Rio de Janeiro', 'Pelourinho, Salvador', 'Savassi, Belo Horizonte', 'Lapa, Rio de Janeiro'],
    nightlifeZones: ['Lapa, Rio de Janeiro', 'Vila Madalena, São Paulo', 'Pelourinho, Salvador', 'Recife Antigo, Recife', 'Praia de Iracema, Fortaleza'],
    instagrammableSpots: ['Christ the Redeemer, Rio de Janeiro', 'Sugarloaf Mountain, Rio de Janeiro', 'Iguazu Falls, Foz do Iguaçu', 'Escadaria Selarón, Rio de Janeiro', 'Ibirapuera Park, São Paulo'],
    areasToAvoid: ['Favelas without a guide, Rio de Janeiro', 'Cracolândia, São Paulo', 'Isolated beaches at night'],
    bestBeaches: ['Copacabana Beach, Rio de Janeiro', 'Ipanema Beach, Rio de Janeiro', 'Praia do Sancho, Fernando de Noronha', 'Jericoacoara Beach, Ceará', 'Praia de Pipa, Natal'],
  },
  mexico: {
    bestFoodAreas: ['Coyoacán, Mexico City', 'Roma Norte, Mexico City', 'Zona Romántica, Puerto Vallarta', 'Mercado 28, Cancún', 'Centro Histórico, Oaxaca'],
    nightlifeZones: ['Condesa, Mexico City', 'Zona Hotelera, Cancún', '5th Avenue, Playa del Carmen', 'Zona Rosa, Mexico City', 'Malecón, Puerto Vallarta'],
    instagrammableSpots: ['Chichen Itza, Yucatán', 'Cenote Ik Kil, Yucatán', 'Guanajuato colorful streets', 'Teotihuacan pyramids', 'Tulum Ruins, Quintana Roo'],
    areasToAvoid: ['Tepito, Mexico City', 'Border towns at night', 'Inner Doctores, Mexico City'],
    bestBeaches: ['Playa del Carmen, Riviera Maya', 'Tulum Beach, Quintana Roo', 'Playa Norte, Isla Mujeres', 'Zipolite, Oaxaca', 'Playa Balandra, La Paz'],
  },
  india: {
    bestFoodAreas: ['Chandni Chowk, Delhi', 'Mohammed Ali Road, Mumbai', 'Church Street, Bangalore', 'Park Street, Kolkata', 'T. Nagar, Chennai'],
    nightlifeZones: ['Bandra, Mumbai', 'Connaught Place, Delhi', 'MG Road, Bangalore', 'Park Street, Kolkata', 'Baga Beach, Goa'],
    instagrammableSpots: ['Taj Mahal, Agra', 'Hawa Mahal, Jaipur', 'Varanasi Ghats', 'Jodhpur Blue City', 'Kerala Backwaters, Alleppey'],
    areasToAvoid: ['Isolated areas at night in Delhi', 'Dharavi slum (without a guide), Mumbai', 'Overcrowded train stations during rush hour'],
    bestBeaches: ['Palolem Beach, Goa', 'Radhanagar Beach, Andaman Islands', 'Varkala Beach, Kerala', 'Kovalam Beach, Kerala', 'Baga Beach, Goa'],
  },
  thailand: {
    bestFoodAreas: ['Chinatown (Yaowarat), Bangkok', 'Khao San Road, Bangkok', 'Chiang Mai Night Bazaar', 'Walking Street Market, Chiang Mai', 'Kata, Phuket'],
    nightlifeZones: ['Khao San Road, Bangkok', 'RCA (Royal City Avenue), Bangkok', 'Walking Street, Pattaya', 'Bangla Road, Patong, Phuket', 'Thapae Gate area, Chiang Mai'],
    instagrammableSpots: ['Grand Palace, Bangkok', 'Phi Phi Islands, Krabi', 'Wat Arun, Bangkok', 'White Temple, Chiang Rai', 'Maya Bay, Phi Phi'],
    areasToAvoid: ['Patpong (scam bars), Bangkok', 'Walking Street (late night scams), Pattaya', 'Khao San Road (petty theft late night)'],
    bestBeaches: ['Railay Beach, Krabi', 'Maya Bay, Phi Phi Islands', 'Koh Lipe, Satun', 'Phra Nang Beach, Krabi', 'Kata Beach, Phuket'],
  },
  'south korea': {
    bestFoodAreas: ['Myeongdong, Seoul', 'Gwangjang Market, Seoul', 'Nampo-dong, Busan', 'Jeonju Hanok Village', 'Insadong, Seoul'],
    nightlifeZones: ['Hongdae, Seoul', 'Gangnam, Seoul', 'Itaewon, Seoul', 'Haeundae, Busan', 'Sinchon, Seoul'],
    instagrammableSpots: ['Gyeongbokgung Palace, Seoul', 'Bukchon Hanok Village, Seoul', 'Gamcheon Culture Village, Busan', 'Nami Island, Gapyeong', 'Lotte World Tower, Seoul'],
    areasToAvoid: ['Itaewon (late night petty crime), Seoul', 'Areas near red-light districts in Cheongnyangni'],
  },
  'korea (republic of)': {
    bestFoodAreas: ['Myeongdong, Seoul', 'Gwangjang Market, Seoul', 'Nampo-dong, Busan', 'Jeonju Hanok Village', 'Insadong, Seoul'],
    nightlifeZones: ['Hongdae, Seoul', 'Gangnam, Seoul', 'Itaewon, Seoul', 'Haeundae, Busan', 'Sinchon, Seoul'],
    instagrammableSpots: ['Gyeongbokgung Palace, Seoul', 'Bukchon Hanok Village, Seoul', 'Gamcheon Culture Village, Busan', 'Nami Island, Gapyeong', 'Lotte World Tower, Seoul'],
    areasToAvoid: ['Itaewon (late night petty crime), Seoul', 'Areas near red-light districts in Cheongnyangni'],
  },
  china: {
    bestFoodAreas: ['Wangfujing Snack Street, Beijing', 'Yuyuan Garden area, Shanghai', 'Muslim Quarter, Xi\'an', 'Kuanzhai Alley, Chengdu', 'Shangxiajiu, Guangzhou'],
    nightlifeZones: ['Sanlitun, Beijing', 'The Bund, Shanghai', 'Tianhe, Guangzhou', 'Jiefangbei, Chongqing', 'Houhai, Beijing'],
    instagrammableSpots: ['Great Wall at Mutianyu, Beijing', 'Zhangjiajie Glass Bridge, Hunan', 'Li River, Guilin', 'The Bund Skyline, Shanghai', 'Forbidden City, Beijing'],
    areasToAvoid: ['Unlicensed tour guides at tourist sites', 'Unmarked taxis or rickshaws near train stations'],
  },
  germany: {
    bestFoodAreas: ['Kreuzberg, Berlin', 'Viktualienmarkt, Munich', 'Altstadt, Düsseldorf', 'Sachsenhausen, Frankfurt', 'Schanzenviertel, Hamburg'],
    nightlifeZones: ['Friedrichshain, Berlin', 'Reeperbahn, Hamburg', 'Altstadt, Düsseldorf', 'Glockenbachviertel, Munich', 'Zülpicher Strasse, Cologne'],
    instagrammableSpots: ['Neuschwanstein Castle, Bavaria', 'Brandenburg Gate, Berlin', 'Cologne Cathedral', 'Bastei Bridge, Saxon Switzerland', 'Rothenburg ob der Tauber'],
    areasToAvoid: ['Görlitzer Park at night, Berlin', 'Frankfurt Hauptbahnhof area at night'],
  },
  italy: {
    bestFoodAreas: ['Trastevere, Rome', 'Spaccanapoli, Naples', 'San Lorenzo Market, Florence', 'Rialto Market, Venice', 'Brera, Milan'],
    nightlifeZones: ['Trastevere, Rome', 'Navigli, Milan', 'Vomero, Naples', 'Campo de\' Fiori, Rome', 'Piazza Santo Spirito, Florence'],
    instagrammableSpots: ['Colosseum, Rome', 'Amalfi Coast, Positano', 'Cinque Terre, Liguria', 'Venice Grand Canal', 'Piazza del Duomo, Florence'],
    areasToAvoid: ['Termini Station area late at night, Rome', 'Naples Quartieri Spagnoli at night', 'San Lorenzo after dark, Rome'],
    bestBeaches: ['Spiaggia dei Conigli, Lampedusa', 'Cala Mariolu, Sardinia', 'Positano Beach, Amalfi Coast', 'San Vito Lo Capo, Sicily', 'Tropea Beach, Calabria'],
  },
  'united kingdom': {
    bestFoodAreas: ['Soho, London', 'Brick Lane, London', 'Curry Mile, Manchester', 'Leith, Edinburgh', 'St Nicholas Market, Bristol'],
    nightlifeZones: ['Soho, London', 'Shoreditch, London', 'Deansgate, Manchester', 'Grassmarket, Edinburgh', 'Broad Street, Birmingham'],
    instagrammableSpots: ['Tower Bridge, London', 'Stonehenge, Wiltshire', 'Edinburgh Castle', 'Bath Royal Crescent', 'Cotswolds Villages'],
    areasToAvoid: ['Parts of East London late at night', 'Moss Side, Manchester (late night)'],
  },
  australia: {
    bestFoodAreas: ['Chinatown, Melbourne', 'Darlinghurst, Sydney', 'Fortitude Valley, Brisbane', 'Northbridge, Perth', 'Gouger Street, Adelaide'],
    nightlifeZones: ['Kings Cross, Sydney', 'Fitzroy, Melbourne', 'Fortitude Valley, Brisbane', 'Northbridge, Perth', 'Surfers Paradise, Gold Coast'],
    instagrammableSpots: ['Sydney Opera House', 'Uluru at sunset, Northern Territory', 'Great Barrier Reef, Queensland', 'Twelve Apostles, Great Ocean Road', 'Bondi Beach, Sydney'],
    areasToAvoid: ['Kings Cross late at night, Sydney', 'Remote outback areas without preparation'],
    bestBeaches: ['Bondi Beach, Sydney', 'Whitehaven Beach, Whitsundays', 'Cable Beach, Broome', 'Turquoise Bay, Exmouth', 'Surfers Paradise, Gold Coast'],
  },
  spain: {
    bestFoodAreas: ['La Boqueria Market, Barcelona', 'Cava Baja, Madrid', 'El Born, Barcelona', 'Triana, Seville', 'Parte Vieja, San Sebastián'],
    nightlifeZones: ['Malasaña, Madrid', 'El Born, Barcelona', 'Alameda de Hércules, Seville', 'Calle Laurel, Logroño', 'Puerto Banús, Marbella'],
    instagrammableSpots: ['Sagrada Familia, Barcelona', 'Alhambra, Granada', 'Plaza de España, Seville', 'Park Güell, Barcelona', 'Ronda Bridge, Málaga'],
    areasToAvoid: ['Las Ramblas (pickpockets), Barcelona', 'El Raval late at night, Barcelona'],
    bestBeaches: ['Playa de la Concha, San Sebastián', 'Cala Comte, Ibiza', 'Playa de ses Illetes, Formentera', 'La Barceloneta, Barcelona', 'Playa de las Catedrales, Galicia'],
  },
  egypt: {
    bestFoodAreas: ['Khan el-Khalili, Cairo', 'Corniche, Alexandria', 'Zamalek, Cairo', 'Souk area, Aswan', 'Downtown Cairo'],
    nightlifeZones: ['Zamalek, Cairo', 'Maadi, Cairo', 'Corniche, Alexandria', 'Naama Bay, Sharm El-Sheikh', 'El Gouna, Hurghada'],
    instagrammableSpots: ['Pyramids of Giza', 'Luxor Temple at night', 'Abu Simbel, Aswan', 'Siwa Oasis', 'Dahab Blue Hole'],
    areasToAvoid: ['North Sinai Province', 'Crowded bazaars (pickpockets)', 'Isolated areas outside tourist zones at night'],
    bestBeaches: ['Sharm El-Sheikh, Sinai', 'Hurghada, Red Sea', 'Marsa Alam, Red Sea', 'Dahab, Sinai', 'El Gouna, Red Sea'],
  },
  turkey: {
    bestFoodAreas: ['Kadıköy, Istanbul', 'Beşiktaş, Istanbul', 'Kemeralti Bazaar, Izmir', 'Gaziantep old town', 'Beyoğlu, Istanbul'],
    nightlifeZones: ['Beyoğlu, Istanbul', 'Kadıköy Barlar Sokağı, Istanbul', 'Bodrum Marina', 'Alaçatı, Izmir', 'Antalya Kaleiçi'],
    instagrammableSpots: ['Cappadocia hot air balloons', 'Hagia Sophia, Istanbul', 'Pamukkale terraces, Denizli', 'Blue Mosque, Istanbul', 'Bosphorus cruise views, Istanbul'],
    areasToAvoid: ['Southeast border regions (Syria/Iraq)', 'Isolated areas of Istanbul at night', 'Tarlabası, Istanbul'],
  },
  vietnam: {
    bestFoodAreas: ['Old Quarter, Hanoi', 'Ben Thanh Market, Ho Chi Minh City', 'Hoi An Ancient Town', 'Bui Vien Street, Ho Chi Minh City', 'Dong Xuan Market, Hanoi'],
    nightlifeZones: ['Bui Vien Street, Ho Chi Minh City', 'Ta Hien Beer Street, Hanoi', 'An Thuong, Da Nang', 'Hoi An riverfront'],
    instagrammableSpots: ['Ha Long Bay, Quang Ninh', 'Hoi An lanterns', 'Golden Bridge, Da Nang', 'Ninh Binh rice paddies', 'Sapa rice terraces'],
    areasToAvoid: ['Motorbike traffic areas (be cautious)', 'Isolated alleys in Ho Chi Minh City at night'],
    bestBeaches: ['My Khe Beach, Da Nang', 'Long Beach, Phu Quoc', 'Nha Trang Beach', 'An Bang Beach, Hoi An', 'Quy Nhon Beach'],
  },
  greece: {
    bestFoodAreas: ['Psirri, Athens', 'Monastiraki, Athens', 'Thessaloniki waterfront', 'Chania Old Town, Crete', 'Oia, Santorini'],
    nightlifeZones: ['Gazi, Athens', 'Psirri, Athens', 'Ladadika, Thessaloniki', 'Mykonos Town', 'Hersonissos, Crete'],
    instagrammableSpots: ['Santorini blue domes', 'Acropolis, Athens', 'Navagio Beach, Zakynthos', 'Meteora Monasteries', 'Mykonos windmills'],
    areasToAvoid: ['Omonia Square late at night, Athens', 'Exarchia (occasional unrest), Athens'],
    bestBeaches: ['Navagio Beach, Zakynthos', 'Elafonissi Beach, Crete', 'Myrtos Beach, Kefalonia', 'Red Beach, Santorini', 'Balos Lagoon, Crete'],
  },
  canada: {
    bestFoodAreas: ['St. Lawrence Market, Toronto', 'Mile End, Montreal', 'Granville Island, Vancouver', 'ByWard Market, Ottawa', 'Kensington Market, Toronto'],
    nightlifeZones: ['King West, Toronto', 'Plateau-Mont-Royal, Montreal', 'Granville Street, Vancouver', 'Rue Crescent, Montreal', 'Whyte Avenue, Edmonton'],
    instagrammableSpots: ['Lake Louise, Banff', 'Niagara Falls, Ontario', 'Old Quebec City', 'Moraine Lake, Alberta', 'CN Tower, Toronto'],
    areasToAvoid: ['Jane and Finch (late night), Toronto', 'Downtown Eastside, Vancouver', 'North Central, Regina'],
  },
  argentina: {
    bestFoodAreas: ['San Telmo, Buenos Aires', 'Palermo Soho, Buenos Aires', 'Mercado del Puerto, Montevideo', 'Mendoza wine region', 'La Boca, Buenos Aires'],
    nightlifeZones: ['Palermo Hollywood, Buenos Aires', 'San Telmo, Buenos Aires', 'Costanera Norte, Buenos Aires', 'Plaza Serrano, Buenos Aires'],
    instagrammableSpots: ['La Boca colorful houses, Buenos Aires', 'Perito Moreno Glacier, El Calafate', 'Iguazu Falls, Misiones', 'Quebrada de Humahuaca, Jujuy', 'Ushuaia End of the World sign'],
    areasToAvoid: ['La Boca beyond tourist streets, Buenos Aires', 'Constitución at night, Buenos Aires', 'Retiro area at night, Buenos Aires'],
  },
  peru: {
    bestFoodAreas: ['Miraflores, Lima', 'Barranco, Lima', 'San Blas, Cusco', 'Surquillo Market, Lima', 'Arequipa historic center'],
    nightlifeZones: ['Barranco, Lima', 'Miraflores, Lima', 'Plaza de Armas area, Cusco', 'San Blas, Cusco'],
    instagrammableSpots: ['Machu Picchu, Cusco', 'Rainbow Mountain, Cusco', 'Lake Titicaca, Puno', 'Colca Canyon, Arequipa', 'Huacachina Oasis, Ica'],
    areasToAvoid: ['Callao, Lima', 'San Juan de Lurigancho at night, Lima', 'Remote trekking trails without a guide'],
  },
  portugal: {
    bestFoodAreas: ['Time Out Market, Lisbon', 'Ribeira, Porto', 'Alfama, Lisbon', 'Mercado do Bolhão, Porto', 'Bairro Alto, Lisbon'],
    nightlifeZones: ['Bairro Alto, Lisbon', 'Cais do Sodré, Lisbon', 'Galerias de Paris, Porto', 'Albufeira Old Town, Algarve', 'Rua de Cândido dos Reis, Porto'],
    instagrammableSpots: ['Belém Tower, Lisbon', 'Pena Palace, Sintra', 'Livraria Lello, Porto', 'Praça do Comércio, Lisbon', 'Douro Valley vineyards'],
    areasToAvoid: ['Martim Moniz late at night, Lisbon', 'Cais do Sodré very late, Lisbon'],
    bestBeaches: ['Praia da Marinha, Algarve', 'Praia de Benagil, Algarve', 'Praia da Falésia, Albufeira', 'Nazaré Beach (surfers)', 'Costa da Caparica, Lisbon'],
  },
  russia: {
    bestFoodAreas: ['Arbat Street, Moscow', 'Danilovsky Market, Moscow', 'Vasilyevsky Island, St. Petersburg', 'Nevsky Prospekt, St. Petersburg', 'Depo Food Mall, Moscow'],
    nightlifeZones: ['Kitay-Gorod, Moscow', 'Rubinshteyna Street, St. Petersburg', 'Patriarch Ponds area, Moscow', 'Red October, Moscow'],
    instagrammableSpots: ['St. Basil\'s Cathedral, Moscow', 'Hermitage Museum, St. Petersburg', 'Red Square, Moscow', 'Church of the Savior on Spilled Blood, St. Petersburg', 'Lake Baikal, Irkutsk'],
    areasToAvoid: ['Outskirts of Moscow late at night', 'Soccer hooligan areas on match days', 'Poorly lit areas near train stations'],
  },
  indonesia: {
    bestFoodAreas: ['Jalan Alor-style warungs, Ubud, Bali', 'Malioboro Street, Yogyakarta', 'Jimbaran Bay, Bali', 'Glodok, Jakarta', 'Seminyak, Bali'],
    nightlifeZones: ['Seminyak, Bali', 'Kuta, Bali', 'Canggu, Bali', 'Kemang, Jakarta', 'SCBD, Jakarta'],
    instagrammableSpots: ['Tegalalang Rice Terraces, Bali', 'Borobudur Temple, Yogyakarta', 'Kelingking Beach, Nusa Penida', 'Tanah Lot Temple, Bali', 'Raja Ampat Islands'],
    areasToAvoid: ['Kuta late at night (petty crime), Bali', 'Isolated areas of Jakarta at night'],
    bestBeaches: ['Kuta Beach, Bali', 'Pink Beach, Komodo', 'Kelingking Beach, Nusa Penida', 'Gili Trawangan, Lombok', 'Nusa Dua Beach, Bali'],
  },
  ...extraMapCategoryData,
};

function getMapCategoryData(countryName) {
  const normalizedName = normalizeCountryName(countryName);
  const keyedName = countryAliases[normalizedName] || normalizedName;
  return knownMapCategoryData[keyedName] || null;
}

const knownCultureProfiles = {
  nepal: {
    traditions: ["Dashain (major Hindu festival)", "Tihar (festival of lights)", "Holi (festival of colors)", "Teej (women's festival)", "Bisket Jatra (Nepali New Year celebration)"],
    socialNorms: ["Greet with Namaste (palms together)", "Respect elders and take off shoes before entering homes", "Public displays of affection are usually frowned upon", "Eating with the right hand is customary", "Modesty in dress and behavior is expected"],
    religionOverview: "Predominantly Hindu (~80%) with significant Buddhist community (~10%), plus Islam and Christianity in smaller numbers. Many cultural practices blend Hindu and Buddhist traditions.",
    etiquetteTips: ["Remove shoes before entering temples, monasteries, and homes", "Do not touch people's heads (especially children), it is considered sacred", "Use your right hand for eating and exchanging items", "Ask permission before taking photographs in religious/cultural sites", "Respect local dress codes at temples and sacred areas"],
  },
  japan: {
    traditions: ["Cherry blossom viewing (Hanami) in spring", "Obon festival (honoring ancestors)", "Matsuri (local shrine festivals with parades and fireworks)", "Shogatsu (New Year celebrations with temple visits)", "Tea ceremony (Chado) as a cultural art form"],
    socialNorms: ["Remove shoes before entering homes and certain venues", "Bowing is the standard greeting, with depth showing respect level", "Avoid eating or drinking while walking", "Respect for elders and hierarchy is deeply ingrained", "Punctuality is extremely important in all settings"],
    religionOverview: "A syncretic blend of Shintoism and Buddhism practiced by most of the population. Many Japanese observe traditions from both religions, visiting Shinto shrines for New Year and Buddhist temples for funerals.",
    etiquetteTips: ["Bow when greeting or showing respect, especially to elders", "Do not tip at restaurants or hotels — it can be considered rude", "Remove shoes before entering temples, homes, and some restaurants", "Avoid talking loudly on public transportation", "Do not stick chopsticks upright in rice — it resembles a funeral rite", "Use two hands when giving or receiving business cards"],
  },
  france: {
    traditions: ["Bastille Day (July 14, national celebration of French independence)", "Christmas markets and elaborate holiday feasts", "Carnival of Nice (one of the world's largest carnival celebrations)", "Wine harvest festivals (Vendanges) across wine regions", "Galette des Rois (King's Cake) on Epiphany"],
    socialNorms: ["French people value intellectual discussion and spirited debate", "Formality is important — use Monsieur/Madame until invited otherwise", "Kissing on both cheeks (la bise) is a common greeting among friends", "Long, leisurely meals are a cherished tradition", "Punctuality is appreciated but slight tardiness is tolerated socially"],
    religionOverview: "Historically Catholic, France is now one of the most secular nations in Europe. About 50% identify as Catholic, with growing Muslim (~8%), Protestant, Jewish, and non-religious populations. Secularism (laïcité) is a core value.",
    etiquetteTips: ["Always greet with 'Bonjour' (morning) or 'Bonsoir' (evening) when entering shops", "Avoid discussing money, salary, or asking overly personal questions", "Table manners matter — keep hands on the table (not in your lap) during meals", "Try to speak some French before switching to English — effort is appreciated", "Dress well — appearance is valued in French culture"],
  },
  'united states': {
    traditions: ["Thanksgiving (family gathering with turkey dinner)", "Independence Day (July 4th fireworks and celebrations)", "Halloween (costumes and trick-or-treating)", "Super Bowl Sunday (major sports and social event)", "Black Friday (post-Thanksgiving shopping tradition)"],
    socialNorms: ["Friendliness and casual informality are common in daily interactions", "Punctuality is valued in business and social settings", "Personal space and privacy are important", "Direct, open communication is preferred over indirect hints", "Tipping is expected and an important part of service workers' income"],
    religionOverview: "A diverse religious landscape with Protestant Christianity being the largest group (~40%), followed by Catholicism (~20%), with significant Jewish, Muslim, Buddhist, Hindu, and growing non-religious populations.",
    etiquetteTips: ["Handshakes are the standard business greeting", "Tipping 15-20% at restaurants is expected and important", "Smiling and eye contact signal friendliness and honesty", "Use first names unless instructed otherwise in formal settings", "Respect local laws — they vary significantly by state"],
  },
  brazil: {
    traditions: ["Carnival (world-famous pre-Lenten celebration, especially in Rio)", "Festas Juninas (June festivals with traditional dress, music, and food)", "Capoeira (Afro-Brazilian martial art blending dance and music)", "Samba and bossa nova music culture", "Reveillon (New Year's Eve celebration with white clothing on beaches)"],
    socialNorms: ["Brazilians are warm, affectionate, and expressive in conversation", "Physical closeness and touch during conversation are normal", "Family is central to Brazilian social life", "Spontaneity and joy in celebration are deeply valued", "Arriving slightly late to social events is common and accepted"],
    religionOverview: "Predominantly Catholic (~65%), with rapidly growing Evangelical/Pentecostal communities (~25%), plus Afro-Brazilian religions like Candomblé and Umbanda, and a growing secular population.",
    etiquetteTips: ["Greet with a handshake or kiss on the cheek — varies by region", "Learn a few Portuguese phrases — Brazilians appreciate the effort", "Be prepared for energetic and lively social interactions", "Dress colorfully and embrace the festive atmosphere", "Accept offers of coffee or food — it shows respect for hospitality"],
  },
  mexico: {
    traditions: ["Día de Muertos (Day of the Dead, honoring deceased loved ones)", "Las Posadas (nine-day Christmas celebration reenacting Mary and Joseph's journey)", "Piñata tradition at birthday parties and celebrations", "Quinceañera (coming-of-age celebration for 15-year-old girls)", "Guelaguetza (Oaxacan indigenous dance festival)"],
    socialNorms: ["Family is the foundation of Mexican social life", "Politeness, respect, and warmth form the basis of interaction", "Personal relationships are essential before business dealings", "Hospitality and generosity are highly valued cultural traits", "Mealtime is social — lunch is the main meal and can last hours"],
    religionOverview: "Predominantly Catholic (~80%) with deep roots in colonial history. Indigenous spiritual practices are blended with Catholicism in many regions. Small but growing Protestant and non-religious communities exist.",
    etiquetteTips: ["Greet with a handshake or embrace — closeness is normal", "Use formal titles (Señor, Señora) with people you don't know well", "Accept offers of food and drink — refusing can be seen as impolite", "Respect Indigenous cultures, traditions, and sacred sites", "Learn some Spanish phrases — locals appreciate the effort, even basic greetings"],
  },
  india: {
    traditions: ["Diwali (festival of lights celebrating good over evil)", "Holi (festival of colors celebrating spring and love)", "Navratri (nine-night festival of dance and worship)", "Eid and Christmas are widely celebrated across communities", "Regional festivals vary enormously — every state has unique celebrations"],
    socialNorms: ["Greet with 'Namaste' — palms together with a slight bow", "Deep respect for elders, teachers (gurus), and parents", "Family loyalty and collective decision-making are paramount", "Social hierarchy and age often determine interaction styles", "Hospitality is sacred — guests are treated as divine (Atithi Devo Bhava)"],
    religionOverview: "The world's most religiously diverse nation: Hindu (~80%), Islam (~14%), Christianity (~2.3%), Sikhism (~1.7%), Buddhism, Jainism, and many tribal religions. Religious festivals and practices profoundly shape daily life.",
    etiquetteTips: ["Use your right hand for eating, greeting, and exchanging items", "Remove shoes before entering homes, temples, and mosques", "Ask permission before photographing people or religious sites", "Respect sacred animals, especially cows, which are revered", "Dress modestly at religious sites — cover shoulders and knees", "Bargaining is expected and enjoyed in markets and street shops"],
  },
  thailand: {
    traditions: ["Songkran (Thai New Year water festival in April)", "Loy Krathong (floating lantern and flower festival)", "Buddhist holidays and ceremonies throughout the year", "Local temple fairs (Ngan Wat) with food and entertainment", "Royal ceremonies and celebrations honoring the monarchy"],
    socialNorms: ["Respect for the monarchy is deeply held and legally enforced", "The Thai smile (yim) communicates politeness, apology, and friendliness", "Avoiding public confrontation and maintaining calm (jai yen) is valued", "Hierarchy and seniority determine social interaction", "Buddhism influences daily life, ethics, and social behavior"],
    religionOverview: "Over 94% of the population practices Theravada Buddhism, which shapes art, architecture, education, and daily routines. Small Muslim (~5%), Christian, and Hindu communities exist, particularly in southern provinces.",
    etiquetteTips: ["Perform the wai greeting — press palms together and bow slightly", "Never disrespect the Thai royal family — it is a criminal offense", "Remove shoes before entering temples, homes, and some shops", "Do not point your feet at people or Buddha images — feet are considered the lowest part of the body", "Do not touch anyone's head — it is considered the most sacred part of the body", "Pour drinks for others before yourself, and always accept a drink offered by an elder"],
  },
  'south korea': {
    traditions: ["Chuseok (Harvest Festival, similar to Thanksgiving)", "Seollal (Lunar New Year with family gatherings and ancestral rites)", "Kimchi-making season (Kimjang, a communal tradition)", "Hanbok (traditional clothing worn on holidays)", "Tea ceremonies and temple stay programs"],
    socialNorms: ["Respect for elders is fundamental — use honorific speech (존댓말)", "Collective harmony is valued over individual expression", "Punctuality is highly valued in business and social settings", "Removing shoes before entering homes is standard", "Modesty in dress and behavior is expected", "Drinking culture is social — pouring for others shows respect"],
    religionOverview: "A diverse religious landscape with a significant portion identifying as irreligious (~56%). Major religions include Protestantism (~20%), Buddhism (~16%), and Catholicism (~8%). Confucian values deeply influence social ethics.",
    etiquetteTips: ["Bow when greeting or showing respect, especially to elders", "Use two hands when giving or receiving objects, especially money or gifts", "Avoid writing names in red ink, as it is traditionally associated with the deceased", "Don't stick chopsticks upright in your rice bowl, as it resembles offerings to the dead", "Pour drinks for others before yourself, and always accept a drink offered by an elder"],
  },
  'korea (republic of)': {
    traditions: ["Chuseok (Harvest Festival, similar to Thanksgiving)", "Seollal (Lunar New Year with family gatherings and ancestral rites)", "Kimchi-making season (Kimjang, a communal tradition)", "Hanbok (traditional clothing worn on holidays)", "Tea ceremonies and temple stay programs"],
    socialNorms: ["Respect for elders is fundamental — use honorific speech (존댓말)", "Collective harmony is valued over individual expression", "Punctuality is highly valued in business and social settings", "Removing shoes before entering homes is standard", "Modesty in dress and behavior is expected", "Drinking culture is social — pouring for others shows respect"],
    religionOverview: "A diverse religious landscape with a significant portion identifying as irreligious (~56%). Major religions include Protestantism (~20%), Buddhism (~16%), and Catholicism (~8%). Confucian values deeply influence social ethics.",
    etiquetteTips: ["Bow when greeting or showing respect, especially to elders", "Use two hands when giving or receiving objects, especially money or gifts", "Avoid writing names in red ink, as it is traditionally associated with the deceased", "Don't stick chopsticks upright in your rice bowl, as it resembles offerings to the dead", "Pour drinks for others before yourself, and always accept a drink offered by an elder"],
  },
  china: {
    traditions: ["Chinese New Year (Spring Festival with fireworks and family reunions)", "Mid-Autumn Festival (mooncakes and lanterns)", "Dragon Boat Festival (dragon boat races and zongzi)", "Qingming Festival (tomb sweeping to honor ancestors)", "Lantern Festival (marking end of New Year celebrations)"],
    socialNorms: ["Respect for elders and authority is deeply important", "Gift-giving is common, but gifts are refused before accepting", "Collective harmony (mianzi/face) is central to interactions", "Tea culture is integral to hospitality and business", "Punctuality is important in business settings"],
    religionOverview: "Officially atheist state, but folk religion, Buddhism (~18%), Taoism, and Confucianism profoundly influence culture. Small Christian (~5%) and Muslim (~2%) communities exist.",
    etiquetteTips: ["Present and receive business cards with both hands", "Avoid giving clocks, umbrellas, or white/black gifts — they symbolize death", "Do not stick chopsticks upright in rice", "Learn a few Mandarin phrases — effort is appreciated", "Avoid discussing politics, Taiwan, or Tibet with strangers"],
  },
  germany: {
    traditions: ["Oktoberfest (world-famous beer festival in Munich)", "Christmas markets (Weihnachtsmärkte) throughout the country", "Karneval/Fasching (pre-Lenten carnival celebrations)", "Maifest (May Day celebrations)", "Reunification Day (October 3rd national holiday)"],
    socialNorms: ["Punctuality is extremely important — being late is rude", "Direct, honest communication is valued over small talk", "Privacy and personal boundaries are respected", "Recycling and environmental consciousness are deeply ingrained", "Sunday is a rest day — most shops close (Sonntagsruhe)"],
    religionOverview: "Roughly equal Catholic and Protestant populations (~27% each), with growing Muslim (~6%) and non-religious communities. Eastern Germany is one of the most secular regions in the world.",
    etiquetteTips: ["Be punctual — arrive on time or a few minutes early", "Shake hands firmly when greeting someone", "Don't make the OK hand gesture — it can be offensive", "Address people formally (Herr/Frau) until invited to use first names", "Respect quiet hours (Ruhezeit) — avoid loud noise during midday and late evening"],
  },
  italy: {
    traditions: ["Carnevale di Venezia (Venice Carnival with elaborate masks)", "Palio di Siena (historic horse race)", "Ferragosto (August 15th midsummer holiday)", "Christmas Nativity scenes (presepi) are national art", "La Passeggiata (evening stroll tradition in towns)"],
    socialNorms: ["Family is the core of Italian social life", "Meals are sacred — lunch and dinner are social events", "Fashion and personal appearance are highly valued", "Animated conversation with hand gestures is normal", "Regional identity is strong — Italians identify with their city or region"],
    religionOverview: "Predominantly Catholic (~80%), as the seat of the Vatican. However, regular church attendance has declined. Small Protestant, Muslim, and non-religious populations exist.",
    etiquetteTips: ["Greet with a handshake or kiss on both cheeks among friends", "Dress well — Italians notice and appreciate good style", "Never order cappuccino after 11am — espresso is the afternoon drink", "Tipping is not required but rounding up is appreciated", "Learn a few Italian phrases — locals love the effort"],
  },
  'united kingdom': {
    traditions: ["Bonfire Night (Guy Fawkes Night, November 5th)", "Royal ceremonies and Trooping the Colour", "Afternoon tea tradition", "Remembrance Day (honoring veterans on November 11th)", "Boxing Day (December 26th, shopping and sports)"],
    socialNorms: ["Queuing (standing in line) is sacred — never cut in line", "Politeness, understatement, and dry humor are valued", "Personal space and privacy are important", "Small talk about weather is a national pastime", "Excessive directness can be seen as rude"],
    religionOverview: "Historically Church of England (Anglican), with significant Catholic, Muslim (~5%), Hindu, Sikh, and Jewish communities. About half the population identifies as non-religious.",
    etiquetteTips: ["Queue patiently — cutting in line is a serious social offense", "Say 'please', 'thank you', and 'sorry' frequently", "Tipping 10-15% at restaurants is customary", "Don't ask personal questions about salary or age", "Respect the monarchy — even casual criticism can offend some people"],
  },
  australia: {
    traditions: ["Australia Day (January 26th national celebrations)", "ANZAC Day (April 25th, honoring veterans)", "Melbourne Cup (major horse racing event)", "Christmas celebrated in summer with barbecues", "Aboriginal cultural ceremonies and Dreamtime stories"],
    socialNorms: ["Egalitarianism — everyone is treated equally regardless of status", "Casual, informal communication style (mate culture)", "Outdoor lifestyle and love of sports", "Tall poppy syndrome — bragging or showing off is frowned upon", "Barbecues (barbies) are a major social activity"],
    religionOverview: "Increasingly secular, with Christianity (~44%, declining), Islam (~3%), Buddhism (~2.4%), Hinduism (~2.7%), and a growing non-religious population (~39%). Aboriginal spiritual practices are ancient and respected.",
    etiquetteTips: ["Be casual and friendly — formality can seem pretentious", "Don't tip heavily — it's not expected but appreciated for good service", "Respect Indigenous Australian cultures and sacred sites", "Swim between the flags at beaches — safety is taken seriously", "Avoid bragging — Australians value humility"],
  },
  spain: {
    traditions: ["La Tomatina (tomato-throwing festival in Buñol)", "Running of the Bulls in Pamplona (San Fermín)", "Semana Santa (Holy Week processions)", "Flamenco music and dance culture", "Siesta tradition (afternoon rest period)"],
    socialNorms: ["Spanish people are warm, social, and family-oriented", "Late meals — lunch at 2-3pm, dinner at 9-10pm", "Nightlife starts very late — clubs open after midnight", "Physical closeness and cheek-kissing greetings are normal", "Passionate discussion is welcomed, not considered arguing"],
    religionOverview: "Historically Catholic (~60%), but Spain has become increasingly secular, especially among younger generations. Small Muslim, Protestant, and non-religious communities exist.",
    etiquetteTips: ["Greet with two kisses on the cheeks (right then left)", "Adjust to the later meal schedule — don't expect dinner at 6pm", "Learn basic Spanish — English is less widely spoken outside tourist areas", "Don't rush meals — dining is a social event, not just eating", "Respect local customs during fiestas and religious celebrations"],
  },
  egypt: {
    traditions: ["Ramadan fasting and Eid celebrations", "Sham el-Nessim (spring festival dating to ancient Egypt)", "Moulid celebrations (commemorating saints and holy figures)", "Pharaonic heritage and pride in ancient civilization", "Nubian cultural traditions in southern Egypt"],
    socialNorms: ["Hospitality is fundamental — guests are treated generously", "Family and community bonds are very strong", "Respect for elders and religious leaders is essential", "Gender roles are more traditional, especially outside Cairo", "Bargaining in markets (souks) is expected and enjoyable"],
    religionOverview: "Predominantly Sunni Muslim (~90%), with a significant Coptic Christian minority (~10%) that is one of the oldest Christian communities in the world.",
    etiquetteTips: ["Dress modestly, especially near mosques and in rural areas", "Use your right hand for eating and greeting", "Accept tea or coffee when offered — it is a sign of hospitality", "Bargain in markets — it is expected and part of the experience", "Ask permission before photographing people, especially women"],
  },
  turkey: {
    traditions: ["Ramadan and Eid celebrations with family feasts", "Whirling Dervish ceremonies (Mevlana tradition)", "Turkish bath (hammam) cultural tradition", "Çay (tea) culture — offering tea is a sign of friendship", "Hıdırellez (spring festival celebrating nature's renewal)"],
    socialNorms: ["Hospitality is legendary — guests are treated as gifts from God", "Respect for elders is shown through gestures and speech", "Tea and coffee are central to social interactions", "Family bonds are extremely strong and multi-generational", "Personal honor and reputation are highly valued"],
    religionOverview: "Predominantly Muslim (~98%, mostly Sunni), with a secular constitutional framework (laïcité). Sufi traditions are culturally significant. Small Christian and Jewish communities exist.",
    etiquetteTips: ["Remove shoes before entering homes and mosques", "Accept tea or coffee when offered — refusing is impolite", "Dress modestly at mosques — cover shoulders, knees, and hair (for women)", "Avoid discussing politics, the Kurdish question, or Armenian history with strangers", "Bargaining is expected in bazaars and markets"],
  },
  ...extraCultureProfiles,
};

const knownFoodData = {
  nepal: [
    { name: "Momos", description: "Steamed or fried dumplings filled with meat or vegetables, served with a spicy dipping sauce.", famousFor: "Nepal's most popular snack and a staple street food." },
    { name: "Dal Bhat", description: "Lentil soup served with rice, vegetables, and pickles; a daily meal for many Nepalis.", famousFor: "Nutritional balance and hearty energy for trekkers." },
    { name: "Newari Khaja Set", description: "Traditional Newari platter featuring beaten rice, meat, achar, and sweets.", famousFor: "Rich, layered flavors from the Kathmandu Valley cuisine." },
    { name: "Thukpa", description: "Tibetan-style noodle soup with vegetables and meat, ideal for cold mountain regions.", famousFor: "Warming comfort food popular in higher altitudes." },
    { name: "Sel Roti", description: "Ring-shaped sweet rice bread, often served during festivals.", famousFor: "Festive favorite during Dashain and Tihar." },
  ],
  japan: [
    { name: "Sushi", description: "Vinegar rice with raw or cooked seafood and vegetables.", famousFor: "World-renowned dish with delicate preparation." },
    { name: "Ramen", description: "Noodle soup with meat broth, toppings, and seasonings.", famousFor: "Comfort food with regional flavor variations." },
    { name: "Tempura", description: "Lightly battered and fried seafood and vegetables.", famousFor: "Crispy texture and elegant presentation." },
    { name: "Okonomiyaki", description: "Savory pancake with cabbage, meat, and special sauce.", famousFor: "Popular street food in Osaka." },
    { name: "Sashimi", description: "Thinly sliced raw fish served with soy sauce and wasabi.", famousFor: "Freshness and seafood quality." },
  ],
  france: [
    { name: "Croissant", description: "Buttery, flaky pastry served at breakfast.", famousFor: "Iconic French viennoiserie." },
    { name: "Coq au Vin", description: "Chicken braised in red wine with mushrooms and bacon.", famousFor: "Classic slow-cooked French stew." },
    { name: "Ratatouille", description: "Vegetable stew from Provence with tomato and herbs.", famousFor: "Healthy and aromatic Proven�al staple." },
    { name: "Bouillabaisse", description: "Seafood soup from Marseille with saffron and herbs.", famousFor: "Rich, complex flavor from fish broth." },
    { name: "Creme Brulee", description: "Custard dessert with caramelized sugar topping.", famousFor: "Contrast of creamy and crunchy textures." },
  ],
  'united states': [
    { name: "Hamburger", description: "Beef patty in a bun with toppings.", famousFor: "Classic American fast food." },
    { name: "Barbecue Ribs", description: "Slow-cooked ribs with sweet, smoky sauce.", famousFor: "Regional BBQ styles across the U.S." },
    { name: "Mac and Cheese", description: "Cheesy baked macaroni.", famousFor: "Comforting family favorite." },
    { name: "Clam Chowder", description: "Creamy New England soup with clams and potatoes.", famousFor: "Coastal seafood specialty." },
    { name: "Apple Pie", description: "Baked pie with spiced apple filling.", famousFor: "Symbol of American home cooking." },
  ],
  brazil: [
    { name: "Feijoada", description: "A hearty stew of black beans with various cuts of pork and beef, typically served with rice, farofa, and collard greens.", famousFor: "National dish representing Brazil's culinary heritage." },
    { name: "Churrasco", description: "Brazilian barbecue featuring various grilled meats, often served rodizio style where skewers are brought to your table.", famousFor: "Rodizio style dining tradition in Brazil." },
    { name: "Pao de Queijo", description: "Small, baked cheese rolls made from tapioca flour, giving them a chewy, gooey texture.", famousFor: "Popular snack and breakfast item." },
    { name: "Brigadeiro", description: "A traditional Brazilian chocolate truffle, made from condensed milk, cocoa powder, butter, and chocolate sprinkles.", famousFor: "Popular dessert and party treat." },
    { name: "Acai na Tigela", description: "Frozen acai berry pulp served in a bowl, often topped with granola, bananas, and other fruits.", famousFor: "Healthy and refreshing snack." },
  ],
  mexico: [
    { name: "Tacos", description: "Corn or flour tortillas filled with marinated meat, fish, or vegetables, topped with salsa and cilantro.", famousFor: "Iconic Mexican street food and staple." },
    { name: "Chiles Rellenos", description: "Roasted poblano peppers stuffed with cheese or meat, covered in egg batter and tomato sauce.", famousFor: "Hearty vegetarian-friendly dish." },
    { name: "Mole Poblano", description: "Complex sauce made with chilies, spices, chocolate, and nuts, served over chicken.", famousFor: "Ancient pre-Hispanic recipe with deep flavors." },
    { name: "Tamales", description: "Corn dough filled with meat, cheese, or vegetables, wrapped in corn husks and steamed.", famousFor: "Traditional dish for special occasions." },
    { name: "Ceviche", description: "Raw fish or seafood cured in citrus juice, mixed with onions, cilantro, and chili peppers.", famousFor: "Refreshing coastal specialty." },
  ],
  india: [
    { name: "Tikka Masala", description: "Marinated meat or vegetables cooked in a clay oven, served in a creamy tomato sauce.", famousFor: "Popular curry loved worldwide." },
    { name: "Biryani", description: "Fragrant rice dish cooked with spiced meat, ghee, and aromatic spices like saffron.", famousFor: "Layered flavors and fried technique." },
    { name: "Samosa", description: "Fried pastry filled with spiced potatoes and peas or meat.", famousFor: "Quintessential Indian appetizer and street food." },
    { name: "Dosa", description: "Crispy fermented rice and lentil crepe from South India, served with sambar and chutney.", famousFor: "South Indian breakfast staple." },
    { name: "Paneer Butter Masala", description: "Cottage cheese cubes in a rich, creamy tomato-based sauce.", famousFor: "Vegetarian favorite with complex spices." },
  ],
  thailand: [
    { name: "Pad Thai", description: "Stir-fried rice noodles with shrimp, tofu, or chicken, bean sprouts, and peanuts.", famousFor: "National noodle dish of Thailand." },
    { name: "Tom Yum", description: "Hot and sour soup with lemongrass, galangal, lime, and seafood or chicken.", famousFor: "Aromatic and refreshing soup." },
    { name: "Green Curry", description: "Creamy curry made with green chilies, coconut milk, and meat or vegetables.", famousFor: "Complex heat and creamy balance." },
    { name: "Larb", description: "Spicy minced meat salad with lime, fish sauce, herbs, and toasted rice powder.", famousFor: "Northeastern Thai favorite." },
    { name: "Satay", description: "Grilled meat skewers served with creamy peanut sauce.", famousFor: "Popular appetizer throughout Southeast Asia." },
  ],
  italy: [
    { name: "Pasta Carbonara", description: "Creamy pasta with guanciale, egg yolk, pecorino cheese, and black pepper.", famousFor: "Roman classic made with simple, quality ingredients." },
    { name: "Risotto", description: "Creamy rice dish cooked with broth, wine, and various ingredients like mushrooms or seafood.", famousFor: "Northern Italian staple with delicate texture." },
    { name: "Lasagna", description: "Layered pasta with meat sauce, bechamel, and cheese.", famousFor: "Family comfort food made with love." },
    { name: "Osso Buco", description: "Braised veal shank served with saffron risotto and gremolata.", famousFor: "Elegant Milanese specialty." },
    { name: "Tiramisu", description: "Dessert made with ladyfingers dipped in coffee, mascarpone cream, and cocoa powder.", famousFor: "Decadent coffee-flavored treat." },
  ],
  spain: [
    { name: "Paella", description: "Saffron rice cooked with seafood, chicken, or vegetables in a wide shallow pan.", famousFor: "Iconic Spanish dish from Valencia." },
    { name: "Tapas", description: "Small plates of various appetizers like cheese, cured meats, patatas bravas, and seafood.", famousFor: "Spanish dining culture and social tradition." },
    { name: "Gazpacho", description: "Cold tomato-based soup, perfect for hot summer days, served with bread croutons.", famousFor: "Refreshing Andalusian summer staple." },
    { name: "Jamon Iberico", description: "Premium cured ham from black Iberian pigs, sliced thin and served with bread.", famousFor: "Prized delicacy and symbol of Spanish cuisine." },
    { name: "Churros", description: "Fried pastry sticks served with hot chocolate for dipping.", famousFor: "Popular breakfast and dessert item." },
  ],
  germany: [
    { name: "Schnitzel", description: "Thin, breaded cutlet of veal, pork, or chicken, fried until golden and crispy.", famousFor: "Crispy exterior and tender meat inside." },
    { name: "Bratwurst", description: "Spiced pork sausage, grilled and served with sauerkraut and mustard.", famousFor: "Bavarian favorite at beer gardens." },
    { name: "Pretzels", description: "Soft, twisted bread rolls served with butter or cheese dip.", famousFor: "Iconic German snack and Oktoberfest staple." },
    { name: "Sauerbraten", description: "Pot roast marinated in vinegar and spices, served with red cabbage and dumplings.", famousFor: "Slow-cooked comfort food with tangy flavor." },
    { name: "Black Forest Cake", description: "Chocolate cake with whipped cream, cherries, and chocolate shavings.", famousFor: "Elegant German dessert." },
  ],
  china: [
    { name: "Peking Duck", description: "Roasted duck with crispy skin, served with thin pancakes, hoisin sauce, and cucumber.", famousFor: "Beijing specialty with thousands of years of history." },
    { name: "Mapo Tofu", description: "Silken tofu in spicy chili oil and minced pork sauce.", famousFor: "Sichuan classic with numbing and spicy heat." },
    { name: "Dim Sum", description: "Small steamed or fried dumplings and rolls with various fillings, traditionally served with tea.", famousFor: "Cantonese dining tradition." },
    { name: "Hot Pot", description: "Communal cooking of thinly sliced meats and vegetables in simmering broth.", famousFor: "Interactive social dining experience." },
    { name: "Fried Rice", description: "Day-old rice stir-fried with eggs, vegetables, and protein.", famousFor: "Quick, versatile, and universally loved." },
  ],
  'korea (republic of)': [
    { name: "Bibimbap", description: "Mixed rice bowl with vegetables, meat, egg, and gochujang sauce.", famousFor: "Colorful, balanced meal in every bowl." },
    { name: "Korean Barbecue", description: "Grilled marinated meats cooked at the table and wrapped in lettuce leaves.", famousFor: "Interactive dining and tender, flavorful meat." },
    { name: "Kimchi", description: "Fermented vegetables (primarily cabbage) with chili, garlic, and other seasonings.", famousFor: "Essential side dish present at every Korean meal." },
    { name: "Bulgogi", description: "Thinly sliced marinated beef cooked on a griddle or grill.", famousFor: "Sweet and savory marinade with tender meat." },
    { name: "Tteokbokki", description: "Chewy rice cakes in spicy gochujang sauce with vegetables and fish cakes.", famousFor: "Popular street food snack." },
  ],
  vietnam: [
    { name: "Pho", description: "Aromatic rice noodle soup with beef or chicken broth, herbs, and meat.", famousFor: "Vietnam's national dish, served for breakfast." },
    { name: "Banh Mi", description: "French-influenced sandwich with pate, cold cuts, pickled vegetables, and cilantro.", famousFor: "Vietnam's iconic street food." },
    { name: "Spring Rolls", description: "Fresh rice paper rolls filled with shrimp, pork, noodles, and herbs.", famousFor: "Light, refreshing appetizer." },
    { name: "Bun Cha", description: "Grilled pork served with rice vermicelli, fresh herbs, and fish sauce dipping sauce.", famousFor: "Hanoi specialty and summer favorite." },
    { name: "Ca Phe Den", description: "Strong Vietnamese iced coffee made with dark roast and sweetened condensed milk.", famousFor: "Beloved Vietnamese coffee tradition." },
  ],
  greece: [
    { name: "Moussaka", description: "Layered eggplant and meat sauce topped with bechamel, baked until golden.", famousFor: "Greek national dish." },
    { name: "Souvlaki", description: "Grilled meat skewers served with pita bread and tzatziki sauce.", famousFor: "Classic Greek street food." },
    { name: "Spanakopita", description: "Spinach and feta cheese wrapped in crispy phyllo pastry.", famousFor: "Flaky pastry with savory filling." },
    { name: "Saganaki", description: "Fried cheese, often flambeed tableside.", famousFor: "Dramatic presentation and salty, melty flavor." },
    { name: "Baklava", description: "Phyllo pastry layered with nuts and honey syrup.", famousFor: "Sweet, flaky Mediterranean dessert." },
  ],
  peru: [
    { name: "Ceviche Peruano", description: "Fresh fish or seafood cured in citrus juice with red onion, cilantro, and chili peppers.", famousFor: "Peru's national dish and culinary symbol." },
    { name: "Lomo Saltado", description: "Marinated beef stir-fried with onions, tomatoes, and served with rice and fries.", famousFor: "Peruvian-Chinese fusion classic." },
    { name: "Causa", description: "Layered potato terrine with tuna or seafood, topped with avocado.", famousFor: "Cold, colorful appetizer dish." },
    { name: "Cuy al Horno", description: "Oven-roasted guinea pig served with potatoes and corn.", famousFor: "Traditional Andean delicacy." },
    { name: "Anticuchos", description: "Grilled marinated meat skewers served with spicy sauce.", famousFor: "Popular street food and appetizer." },
  ],
  portugal: [
    { name: "Pasteis de Nata", description: "Flaky pastry tarts with creamy custard filling and cinnamon topping.", famousFor: "Iconic Portuguese pastry." },
    { name: "Sardines", description: "Grilled fresh sardines with lemon and sea salt.", famousFor: "Simple, delicious coastal Portuguese staple." },
    { name: "Francesinha", description: "Portuguese sandwich with meat, topped with melted cheese and beer sauce.", famousFor: "Porto specialty sandwich." },
    { name: "Bacalhau a Bras", description: "Shredded salt cod mixed with thin-cut fried potatoes and olives.", famousFor: "Beloved Portuguese comfort food." },
    { name: "Arroz de Marisco", description: "Seafood rice cooked in rich seafood broth.", famousFor: "Portuguese seafood specialty." },
  ],
  australia: [
    { name: "Barbie (BBQ)", description: "Australian barbecue with grilled steaks, sausages, and seafood.", famousFor: "Australian outdoor dining tradition." },
    { name: "Lamingtons", description: "Sponge cake cubes coated in chocolate and coconut.", famousFor: "Classic Australian dessert." },
    { name: "Meat Pies", description: "Pastry pies filled with meat, gravy, and vegetables.", famousFor: "Iconic Australian snack." },
    { name: "Pavlova", description: "Meringue dessert topped with whipped cream and fresh berries.", famousFor: "Light, indulgent dessert." },
    { name: "Vegemite on Toast", description: "Toast spread with salty yeast extract spread.", famousFor: "Distinctly Australian breakfast." },
  ],
  canada: [
    { name: "Poutine", description: "Fries covered with gravy and cheese curds.", famousFor: "Quebec's beloved comfort food." },
    { name: "Butter Tarts", description: "Small pastry cups filled with butter, sugar, and raisins.", famousFor: "Iconic Canadian treat." },
    { name: "Montreal Bagels", description: "Denser, sweeter bagels boiled in honey water and baked in wood ovens.", famousFor: "Montreal Jewish community tradition." },
    { name: "Tourtiere", description: "Traditional meat pie filled with ground pork and spices.", famousFor: "Holiday meal staple." },
  ],
  argentina: [
    { name: "Asado", description: "Argentine barbecue with grilled meats, sausages, and organ meats.", famousFor: "Argentine culinary tradition and social gathering." },
    { name: "Milanesa", description: "Thin, breaded, fried cutlet of beef or chicken.", famousFor: "Simple, flavorful main course." },
    { name: "Empanadas", description: "Pastry pockets filled with meat, cheese, or vegetables.", famousFor: "Popular street food and appetizer." },
    { name: "Medialunas", description: "Sweet or savory croissant-like pastries.", famousFor: "Argentine breakfast staple." },
    { name: "Alfajores", description: "Cookies sandwich with dulce de leche between layers.", famousFor: "Sweet Argentine treat." },
  ],
  ...extraFoodData,
};

function getFoodData(countryName) {
  const normalized = countryName.toLowerCase().trim();
  const alias = countryAliases[normalized] || normalized;
  if (knownFoodData[alias]) return knownFoodData[alias];

  return [
    { name: `${countryName} Local Specialty`, description: 'Popular traditional dish.', famousFor: 'Traditional flavors and heritage' },
    { name: `${countryName} Street Food`, description: `A beloved street-side favorite in ${countryName}.`, famousFor: 'Authentic local taste' },
    { name: `${countryName} Folk Stew`, description: `Hearty stew prepared with traditional ingredients from ${countryName}.`, famousFor: 'Comforting home-style flavor' },
    { name: `${countryName} Grilled Dish`, description: `Smoky, grilled specialty from ${countryName}.`, famousFor: 'Regional grilling techniques' },
    { name: `${countryName} Sweet Treat`, description: `Dessert item commonly enjoyed in ${countryName}.`, famousFor: 'Local sweet traditions' },
  ];
}


function getCultureProfile(countryName) { return null; }

async function getPopulationFromWorldBank(iso2) {
  if (!iso2 || typeof iso2 !== 'string' || iso2.length !== 2) return 0;
  const code = iso2.toLowerCase();
  try {
    const res = await fetch(`https://api.worldbank.org/v2/country/${code}/indicator/SP.POP.TOTL?date=2023&format=json&per_page=1`);
    if (!res.ok) return 0;
    const data = await res.json();
    const value = Number(data?.[1]?.[0]?.value);
    if (!Number.isNaN(value) && value > 0) return value;
  } catch (e) {
    // ignore, fallback to restcountries value
  }
  return 0;
}

async function resolveExchangeRate(currencyCode) {
  if (!currencyCode) return 1;
  const up = currencyCode.toUpperCase();
  if (up === 'USD') return 1;

  const endpoint = `https://open.er-api.com/v6/latest/USD`;
  let fetchedRate = null;

  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const rate = Number(json.rates?.[up]);
      if (!Number.isNaN(rate) && rate > 0) fetchedRate = rate;
    }
  } catch (err) {
    console.warn('resolveExchangeRate primary open.er-api.com fetch failed', err?.message || err);
  }

  if (!fetchedRate) {
    // exchangerate.host now requires API key; attempt fallback endpoint if available
    const fallbackEndpoint = `https://api.exchangerate.host/convert?from=USD&to=${up}&amount=1`;
    try {
      const fallback = await fetch(fallbackEndpoint, { cache: 'no-store' });
      if (fallback.ok) {
        const data = await fallback.json();
        const rate = Number(data.result);
        if (!Number.isNaN(rate) && rate > 0) fetchedRate = rate;
      }
    } catch (err) {
      console.warn('resolveExchangeRate fallback exchangerate.host fetch failed', err?.message || err);
    }
  }

  if (fetchedRate && fetchedRate > 0) return fetchedRate;

  const fallbackRate = knownCurrencyExchangeRates[up];
  if (fallbackRate && fallbackRate > 0) return fallbackRate;

  console.warn(`resolveExchangeRate used final default for ${currencyCode}`);
  return 1;
}

async function lookupCitiesFromWikipedia(countryName) {
  try {
    const query = encodeURIComponent(`major cities in ${countryName}`);
    const searchUrl = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&list=search&srsearch=${query}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const title = searchData?.query?.search?.[0]?.title;
    if (!title) return [];

    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!summaryRes.ok) return [];

    const summaryJson = await summaryRes.json();
    const text = String(summaryJson.extract || '');
    const match = text.match(/(?:major cities|largest cities|principal cities)(?:\s+.*?)(?:are|include)\s+([^\.;]+)/i);
    if (!match?.[1]) return [];

    const cities = match[1]
      .split(',')
      .map((item) => item.replace(/\b(and|or)\b/gi, '').trim())
      .filter((c) => c.length > 2)
      .slice(0, 6);

    return Array.from(new Set(cities));
  } catch {
    return [];
  }
}

async function getMajorCities(countryName, capital, countryCode = '') {
  const knownCities = {
    japan: ['Tokyo', 'Kyoto', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka'],
    brazil: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte'],
    egypt: ['Cairo', 'Alexandria', 'Giza', 'Shubra Al-Kheima', 'Port Said', 'Suez'],
    germany: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart'],
    china: ['Beijing', 'Shanghai', 'Chongqing', 'Guangzhou', 'Shenzhen', "Xi'an", 'Chengdu'],
    taiwan: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hsinchu', 'Taitung'],
    india: ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad'],
    usa: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
    nepal: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 'Birgunj'],
    france: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes'],
    argentina: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán'],
    uk: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Leeds', 'Liverpool'],
    canada: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa'],
    australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
    mexico: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún'],
    russia: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan'],
  };

  const normalized = String(countryName).trim().toLowerCase();
  if (knownCities[normalized]) return knownCities[normalized];

  const geonamesUser = process.env.GEONAMES_USERNAME;
  if (geonamesUser && countryCode) {
    const cc = countryCode.slice(0, 2).toUpperCase();
    try {
      const geoRes = await fetch(
        `https://secure.geonames.org/searchJSON?country=${cc}&featureClass=P&orderby=population&maxRows=8&username=${encodeURIComponent(geonamesUser)}`
      );
      if (geoRes.ok) {
        const geoJson = await geoRes.json();
        const geoCities = (geoJson.geonames || []).map((entry) => String(entry.name)).filter(Boolean);
        if (geoCities.length >= 3) {
          return Array.from(new Set(geoCities)).slice(0, 6);
        }
      }
    } catch {
      // ignore
    }
  }

  const wikiCities = await lookupCitiesFromWikipedia(countryName);
  if (wikiCities.length > 0) return wikiCities;

  try {
    const cityRes = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName }),
    });

    if (cityRes.ok) {
      const cityJson = await cityRes.json();
      if (cityJson?.data && Array.isArray(cityJson.data) && cityJson.data.length > 0) {
        return Array.from(new Set(cityJson.data.slice(0, 6))).map((x) => String(x));
      }
    }
  } catch {
    // ignore
  }

  const fallbackCities = new Set();
  if (capital) fallbackCities.add(capital);
  fallbackCities.add(`${countryName} City`);
  fallbackCities.add(`${capital || countryName} Metro`);
  fallbackCities.add('Central City');

  return Array.from(fallbackCities).slice(0, 6);
}

async function getNaturalLandmarks(countryName, wikiSummary = '') {
  const knownLandmarks = {
    japan: ['Mount Fuji', 'Arashiyama Bamboo Forest', 'Kegon Falls', 'Oshino Hakkai', 'Shiretoko National Park'],
    brazil: ['Christ the Redeemer', 'Iguazu Falls', 'Amazon Rainforest', 'Sugarloaf Mountain', 'Pantanal'],
    egypt: ['Pyramids of Giza', 'Luxor Temple', 'Valley of the Kings', 'Nile River', 'White Desert'],
    germany: ['Brandenburg Gate', 'Neuschwanstein Castle', 'Cologne Cathedral', 'Black Forest', 'Romantic Road'],
    china: ['Jiuzhai Valley National Park', 'Tiger Leaping Gorge', 'Yellow Mountains (Huangshan)', 'Li River', 'Great Wall of China'],
    taiwan: ['Taroko Gorge', 'Sun Moon Lake', 'Alishan', 'Kenting National Park', 'Jiufen Old Street'],
    india: ['Taj Mahal', 'Himalayas', 'Kerala Backwaters', 'Sundarbans', 'Sariska National Park'],
    usa: ['Grand Canyon', 'Yellowstone', 'Yosemite', 'Niagara Falls', 'Zion National Park'],
    nepal: ['Mount Everest', 'Chitwan National Park', 'Sagarmatha National Park', "Devi's Fall Pokhara", 'Seti River Gorge', 'Gupteshwor Mahadev Cave', 'Syange Waterfall', 'Chamche Waterfall', 'Langtang National Park'],
    france: ['Eiffel Tower', 'Mont Saint-Michel', 'Louvre Museum', 'Versailles', 'French Riviera'],
    argentina: ['Iguazu Falls', 'Perito Moreno Glacier', 'Los Glaciares National Park', 'Cataratas del Iguazú', 'Quebrada de Humahuaca'],
    uk: ["Stonehenge", "Tower of London", "Giant's Causeway", "Lake District", "Edinburgh Castle"],
    canada: ['Niagara Falls', 'Banff National Park', 'CN Tower', 'Old Quebec', 'Jasper National Park', 'Rocky Mountains'],
    australia: ['Great Barrier Reef', 'Sydney Opera House', 'Uluru', 'Great Ocean Road', 'Kakadu National Park', 'Blue Mountains'],
    mexico: ['Chichen Itza', 'Teotihuacan', 'Xochimilco', 'Palenque', 'Copper Canyon', 'Cenotes'],
    russia: ["Red Square", "Saint Basil's Cathedral", 'Lake Baikal', 'Kremlin', 'Peterhof Palace', 'Altai Mountains'],
  };

  const normalized = String(countryName).trim().toLowerCase();
  if (knownLandmarks[normalized]) return knownLandmarks[normalized];

  if (wikiSummary) {
    const match = wikiSummary.match(/(?:landmarks include|including|such as)\s+([^\.]+)/i);
    if (match?.[1]) {
      const items = match[1]
        .split(',')
        .map((p) => p.replace(/\b(and|or)\b/gi, '').trim())
        .filter((p) => p.length > 1)
        .slice(0, 6);
      if (items.length > 0) return items;
    }
  }

  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&list=search&srsearch=${encodeURIComponent(
        `${countryName} landmarks`
      )}`
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const title = searchData?.query?.search?.[0]?.title;
      if (title) {
        const pageRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          const extract = String(pageData.extract || '');
          const found = extract.match(/(?:include|includes|such as)\s+([^\.]+)/i);
          if (found?.[1]) {
            const list = found[1].split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6);
            if (list.length > 0) return list;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return [
    `${countryName} National Park`,
    `${countryName} Heritage Site`,
    `${countryName} Scenic View`,
    `${countryName} Nature Reserve`,
    `${countryName} Historic Center`,
  ];
}

function getClimateDescription(countryName, wikiSummary) {
  const normalized = String(countryName).trim().toLowerCase();
  const known = {
    china: 'Highly diverse, ranging from subarctic in the north to tropical in the south, with temperate and arid zones in between.',
    taiwan: 'Subtropical in the north and tropical in the south with warm, humid summers and mild winters.',
    india: 'Mostly tropical, with distinct wet and dry seasons; northern regions have temperate to alpine climates.',
    usa: 'Varied: arctic in Alaska, tropical in Hawaii and Florida, and temperate in much of the continental US.',
    nepal: 'Varies from tropical in the southern plains to cool temperate in the hills, and alpine/arctic in the high Himalayas. Monsoon season from June to September.',
    japan: 'Temperate monsoon climate with four distinct seasons; summers are hot and humid, winters are cold in the north and mild in the south.',
    brazil: 'Tropical in the Amazon region; subtropical in the south with warm summers and cool winters.',
    egypt: 'Arid desert climate with hot, dry summers and mild winters; minimal rainfall except in coastal areas.',
    germany: 'Temperate oceanic climate with mild summers and cool winters; precipitation is distributed throughout the year.',
    france: 'Temperate oceanic in the west, Mediterranean in the south, and continental in the east.',
    argentina: 'Subtropical in the north, temperate in the central regions, and subpolar in Patagonia.',
    uk: 'Temperate oceanic climate with mild summers, cool winters, and frequent rainfall throughout the year.',
    canada: 'Ranges from arctic in the north to temperate in the south; winters are long and cold in most regions.',
    australia: 'Tropical in the north, arid in the interior, and temperate in the south; highly varied by region.',
    mexico: 'Tropical on coasts, temperate in highlands; dry season November to April.',
    russia: 'Continental climate with long, cold winters and warm summers; varies from arctic to temperate zones.',
  };
  if (known[normalized]) return known[normalized];

  if (wikiSummary) {
    const first = wikiSummary.split('.').filter(Boolean)[0];
    if (first && first.length > 20) return first + '.';
  }

  return 'Climate varies by region and season; local weather conditions should be checked for specific travel dates.';
}

function getLandscapeDescription(countryName, wikiSummary) {
  const normalized = String(countryName).trim().toLowerCase();
  const known = {
    china: 'Vast and varied, including mountains (Himalayas), plateaus (Tibetan Plateau), deserts (Gobi, Taklamakan), plains (North China Plain), and extensive coastlines.',
    taiwan: 'Mountainous interior, rugged coastline, and fertile plains in the west.',
    india: 'Includes the Himalayas, Indo-Gangetic plains, Thar desert, and tropical coastal regions.',
    usa: 'Includes plains, mountains, deserts, forests, and coastlines across a huge geographic range.',
    nepal: 'Dominated by the Himalayan mountain range in the north, including Mount Everest, followed by a hilly region with valleys and fertile plains (Terai) in the south.',
    japan: 'Mountainous archipelago with rugged volcanic terrain, dense forests, deep valleys, and numerous islands.',
    brazil: 'Vast Amazon rainforest in the north; plateaus, coastal plains, and tropical wetlands (Pantanal) in other regions.',
    egypt: 'Desert plateau dominated by the Sahara with the Nile River valley providing a narrow fertile corridor.',
    germany: 'Mix of North German Plain in the north, central highlands, and Bavarian Alps in the south.',
    france: 'Diverse: Alps and Pyrenees, Mediterranean coast, Atlantic coast, and central plateaus.',
    argentina: 'Pampas grasslands in the east, Andes mountains in the west, Patagonian steppe in the south.',
    uk: 'Rolling hills, moorlands in Scotland, mountain peaks in Wales, and extensive coastlines.',
    canada: 'Rocky Mountains in the west, Canadian Shield in the center, Arctic islands in the north, and Great Lakes region.',
    australia: 'Vast interior deserts, tropical rainforests in the north, temperate forests in the southeast, and dramatic coastlines.',
    mexico: 'High plateaus, mountain ranges (Sierra Madre), tropical lowlands, and extensive Mediterranean-like coasts.',
    russia: 'World\'s largest country with vast Siberian forests, Ural Mountains, steppes, and Arctic regions.',
  };
  if (known[normalized]) return known[normalized];

  if (wikiSummary) {
    const parts = wikiSummary.split('.').filter(Boolean);
    if (parts.length >= 2) return parts.slice(1, 3).join('.').trim() + '.';
  }

  return 'Landscape features can include mountains, plains, forests, desert, and coasts depending on the region.';
}

function matchCountryFromResults(results, query) {
  if (!Array.isArray(results) || !query) return null;
  const normalized = query.trim().toLowerCase();

  const exact = results.find((item) => {
    const common = item.name?.common?.toLowerCase() || '';
    const official = item.name?.official?.toLowerCase() || '';
    const alt = Array.isArray(item.altSpellings)
      ? item.altSpellings.map((s) => String(s).toLowerCase())
      : [];
    return common === normalized || official === normalized || alt.includes(normalized);
  });

  if (exact) return exact;

  const fuzzy = results.find((item) => {
    const common = item.name?.common?.toLowerCase() || '';
    const official = item.name?.official?.toLowerCase() || '';
    const alt = Array.isArray(item.altSpellings)
      ? item.altSpellings.map((s) => String(s).toLowerCase())
      : [];
    return common.includes(normalized) || official.includes(normalized) || alt.some((s) => s.includes(normalized));
  });

  if (fuzzy) return fuzzy;
  return results[0] || null;
}

app.get('/api/country', async (req, res) => {
  try {
    const name = String(req.query.name || '').trim().replace(/[<>{}]/g, '');
    if (!name) return res.status(400).json({ error: 'Missing name parameter' });
    if (name.length > 100) return res.status(400).json({ error: 'Invalid country name' });

    // 1) Fetch REST Countries data
    const rc = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`);
    let primary;
    if (!rc.ok) {
      const rcPartial = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`);
      if (!rcPartial.ok) return res.status(404).json({ error: 'Country not found' });
      const rcJsonPartial = await rcPartial.json();
      const partialMatch = matchCountryFromResults(Array.isArray(rcJsonPartial) ? rcJsonPartial : [rcJsonPartial], name);
      if (!partialMatch) return res.status(404).json({ error: 'Country not found' });
      primary = partialMatch;
    } else {
      const rcJson = await rc.json();
      const matched = matchCountryFromResults(Array.isArray(rcJson) ? rcJson : [rcJson], name);
      if (!matched) return res.status(404).json({ error: 'Country not found' });
      primary = matched;
    }

    const iso = (primary.cca2 || primary.cca3 || '').toUpperCase();
    const flagEmoji = codeToFlagEmoji(iso);
    const countryName = primary.name?.common || name;
    const capital = Array.isArray(primary.capital) ? primary.capital[0] : primary.capital || '';

    // Derive BCP 47 language code for Speech Synthesis
    const iso639ToBcp47 = {
      nep: 'ne-NP', hin: 'hi-IN', jpn: 'ja-JP', fra: 'fr-FR', eng: 'en-US',
      por: 'pt-BR', spa: 'es-ES', zho: 'zh-CN', cmn: 'zh-CN', deu: 'de-DE',
      ita: 'it-IT', kor: 'ko-KR', tha: 'th-TH', vie: 'vi-VN', ell: 'el-GR',
      tur: 'tr-TR', ara: 'ar-SA', rus: 'ru-RU', ind: 'id-ID', msa: 'ms-MY',
      pol: 'pl-PL', nld: 'nl-NL', swe: 'sv-SE', nor: 'nb-NO', dan: 'da-DK',
      fin: 'fi-FI', ces: 'cs-CZ', ron: 'ro-RO', hun: 'hu-HU', ukr: 'uk-UA',
      ben: 'bn-IN', tam: 'ta-IN', tel: 'te-IN', mar: 'mr-IN', urd: 'ur-PK',
      fas: 'fa-IR', heb: 'he-IL', cat: 'ca-ES', eus: 'eu-ES', glg: 'gl-ES',
      hrv: 'hr-HR', srp: 'sr-RS', bul: 'bg-BG', slk: 'sk-SK', slv: 'sl-SI',
      lit: 'lt-LT', lav: 'lv-LV', est: 'et-EE', fil: 'fil-PH', tgl: 'fil-PH',
      khm: 'km-KH', lao: 'lo-LA', mya: 'my-MM', sin: 'si-LK', kat: 'ka-GE',
      hye: 'hy-AM', swa: 'sw-KE', amh: 'am-ET', afr: 'af-ZA', mlg: 'mg-MG',
    };
    const primaryLangKey = Object.keys(primary.languages || {})[0] || '';
    const languageCode = iso639ToBcp47[primaryLangKey] || `${primaryLangKey.slice(0, 2)}-${iso}`;
    let population = Number(primary.population || 0);
    const worldBankPopulation = await getPopulationFromWorldBank(iso.slice(0, 2));
    if (worldBankPopulation > 0) {
      population = worldBankPopulation;
    }
    const currencies = primary.currencies || {};
    const currencyCode = Object.keys(currencies)[0] || '';
    const currencyName = currencies[currencyCode]?.name || '';
    const timezones = Array.isArray(primary.timezones) ? primary.timezones[0] : primary.timezones || '';

    // 2) Exchange rate
    const conversionRate = await resolveExchangeRate(currencyCode);

    // 3) Wikipedia summary for geography fallback
    let wikiSummary = '';
    try {
      const wp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`);
      if (wp.ok) {
        const wpj = await wp.json();
        wikiSummary = wpj.extract || '';
      }
    } catch (_e) {
      // ignore
    }

    // 4) Build deterministic response from static data
    const knownGeoData = getGeographyData(countryName);
    const climateText = getClimateDescription(countryName, wikiSummary);
    const landscapeText = getLandscapeDescription(countryName, wikiSummary);
    const cultureData = getCultureData(countryName);
    const mapCategoryData = getMapCategoryData(countryName);

    const staticFoods = getFoodData(countryName);
    const staticAttractions = getAttractionsData(countryName, capital);
    const staticPhrases = getPhrasesData(countryName);
    const staticPrices = getPricesData(countryName);
    const staticBestTime = getBestTimeToVisitData(countryName);
    const staticFunFacts = getFunFactsData(countryName);

    // Check if static data is real curated data (not a generic fallback)
    const hasRealAttractions = staticAttractions.length > 0 && !staticAttractions[0].name.includes(`${countryName} National Museum`);
    const hasRealFoods = staticFoods.length > 0 && !staticFoods[0].name.includes('Local Specialty');
    // Phrases from knownPhrasesData are always preferred; language-group fallbacks are replaced by AI
    const hasHandcraftedPhrases = (() => {
      const key = (countryAliases[countryName.toLowerCase().trim()] || countryName.toLowerCase().trim());
      return !!(knownPhrasesData[key]);
    })();

    // Always call Gemini — it powers phrases for all countries, plus fills gaps in attractions/food/culture.
    // geminiEnrich is cached per session so repeat searches are free.
    const ai = await geminiEnrich(countryName, capital, currencyCode);

    const majorCities = knownGeoData?.majorCities || await getMajorCities(countryName, capital, iso);

    const response = {
      isValidCountry: true,
      overview: {
        flagEmoji,
        capital,
        population: population.toLocaleString(),
        currency: currencyName || currencyCode,
        currencyCode,
        exchangeRateToUSD: conversionRate,
        timeZone: timezones,
      },
      geography: {
        climate: knownGeoData?.climate || (climateText.length > 1 ? climateText : 'Climate varies by region; check local conditions.'),
        landscape: knownGeoData?.landscape || (landscapeText.length > 1 ? landscapeText : 'Diverse landscapes including mountains, plains, and coastlines.'),
        majorCities,
        naturalLandmarks: knownGeoData?.naturalLandmarks || await getNaturalLandmarks(countryName, wikiSummary),
      },
      culture: {
        traditions: cultureData?.traditions || ai?.culture?.traditions || ['Local festivals and celebrations', 'Traditional ceremonies', 'Community gatherings and events', 'Seasonal celebrations', 'Cultural performances'],
        socialNorms: cultureData?.socialNorms || ai?.culture?.socialNorms || ['Greet people politely', 'Respect local customs and traditions', 'Observe personal space norms', 'Follow local dress codes at religious sites', 'Be mindful of local social etiquette'],
        religionOverview: cultureData?.religionOverview || ai?.culture?.religionOverview || 'Diverse religious and spiritual practices.',
        etiquetteTips: cultureData?.etiquetteTips || ai?.culture?.etiquetteTips || ['Greet people politely and use formal titles when appropriate', 'Ask before photographing people or religious sites', 'Respect local customs and dress modestly at religious sites', 'Learn a few words in the local language', 'Be respectful of local traditions and practices'],
      },
      foods: hasRealFoods ? staticFoods : (ai?.foods || staticFoods),
      attractions: hasRealAttractions ? staticAttractions : (ai?.attractions || staticAttractions),
      languageCode,
      // Prefer handcrafted phrases → AI phrases → generic language-group fallback
      // Strip slash-alternatives (e.g. "Hello / Hi" → "Hello") so TTS reads cleanly
      phrases: ((hasHandcraftedPhrases ? staticPhrases : (ai?.phrases || staticPhrases)) || []).map(p => ({
        english: p.english,
        local: (p.local || '').split(/\s*\/\s*/)[0].trim(),
        phonetic: (p.phonetic || p.pronunciation || '').split(/\s*\/\s*/)[0].trim(),
      })),
      prices: ai?.prices || staticPrices,
      bestTimeToVisit: ai?.bestTimeToVisit || staticBestTime,
      funFacts: ai?.funFacts || staticFunFacts,
      mapData: {
        countryQuery: countryName,
        cities: majorCities.slice(0, 5).map(c => ({ name: c, query: `${c}, ${countryName}`, highlights: [] })),
        bestBeaches: mapCategoryData?.bestBeaches || ai?.mapCategories?.bestBeaches || [],
        bestFoodAreas: mapCategoryData?.bestFoodAreas || ai?.mapCategories?.bestFoodAreas || [],
        nightlifeZones: mapCategoryData?.nightlifeZones || ai?.mapCategories?.nightlifeZones || [],
        instagrammableSpots: mapCategoryData?.instagrammableSpots || ai?.mapCategories?.instagrammableSpots || [],
        areasToAvoid: mapCategoryData?.areasToAvoid || ai?.mapCategories?.areasToAvoid || [],
      },
    };

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

// ── /api/itinerary — AI trip planner ────────────────────────────────────────
// Register on both paths to handle Vercel rewrite variations
async function handleItinerary(req, res) {
  try {
    const { countryName, days, budget, styles, traveler, notes } = req.body;
    if (!countryName || !days) return res.status(400).json({ error: 'Missing required fields' });

    const styleList = Array.isArray(styles) ? styles.join(', ') : styles || 'culture';
    const prompt = `You are an expert travel planner. Create a detailed ${days}-day trip itinerary for ${countryName}.

Traveler profile:
- Group: ${traveler || 'couple'}
- Budget: ${budget || 'mid-range'}
- Interests: ${styleList}
- Special requests: ${notes || 'none'}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "intro": "2-3 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "title": "Catchy day title e.g. Arrival & First Impressions",
      "morning": "Detailed morning activity (2-3 sentences with specific place names)",
      "afternoon": "Detailed afternoon activity (2-3 sentences with specific place names)",
      "evening": "Detailed evening activity + dinner recommendation (2-3 sentences)",
      "tip": "One practical tip specific to this day",
      "estimatedCost": "Estimated daily spend e.g. $50-80 per person"
    }
  ],
  "packingEssentials": ["item1", "item2", "item3", "item4", "item5", "item6"],
  "budgetSummary": "2-sentence total trip budget estimate",
  "bestAdvice": "Single most important piece of advice for this specific trip"
}

Rules:
- Create exactly ${days} day objects
- Use real, specific place names in ${countryName}
- Morning/afternoon/evening must be detailed and actionable
- Tips must be practical and specific (not generic)
- Budget estimates must reflect the ${budget} level
- If family, include child-friendly options
- If adventure, include physical activities
- Make it genuinely useful, not generic`;

    const aiResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('Groq itinerary error:', aiResp.status, errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const json = await aiResp.json();
    const raw = json?.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);
  } catch (err) {
    console.error('Itinerary generation failed:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate itinerary' });
  }
}
app.post('/api/itinerary', handleItinerary);
app.post('/itinerary', handleItinerary);

// GET version — takes query params, goes through the same /api rewrite as /api/country
app.get('/api/plan', async (req, res) => {
  try {
    const countryName = String(req.query.countryName || '').trim();
    const days = parseInt(req.query.days) || 7;
    const budget = String(req.query.budget || 'mid-range');
    const styles = String(req.query.styles || 'culture').split(',').filter(Boolean);
    const traveler = String(req.query.traveler || 'couple');
    const notes = String(req.query.notes || '');

    if (!countryName) return res.status(400).json({ error: 'Missing countryName' });
    const planKey = process.env.GROQ_API_KEY || GROQ_API_KEY;
    if (!planKey) return res.status(500).json({ error: 'Missing GROQ_API_KEY' });

    const styleList = styles.join(', ');
    const prompt = `You are an expert travel planner. Create a detailed ${days}-day trip itinerary for ${countryName}.

Traveler profile:
- Group: ${traveler}
- Budget: ${budget}
- Interests: ${styleList}
- Special requests: ${notes || 'none'}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "intro": "2-3 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "title": "Catchy day title",
      "morning": "Detailed morning activity with specific place names (2-3 sentences)",
      "afternoon": "Detailed afternoon activity with specific place names (2-3 sentences)",
      "evening": "Detailed evening activity and dinner recommendation (2-3 sentences)",
      "tip": "One practical tip specific to this day",
      "estimatedCost": "e.g. $50-80 per person"
    }
  ],
  "packingEssentials": ["item1","item2","item3","item4","item5","item6"],
  "budgetSummary": "2-sentence total trip budget estimate",
  "bestAdvice": "Single most important piece of advice for this trip"
}
Rules: exactly ${days} day objects, real place names in ${countryName}, ${budget} budget level.`;

    const aiResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${planKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('Groq plan error:', aiResp.status, errText);
      return res.status(502).json({ error: `Groq error ${aiResp.status}` });
    }

    const json = await aiResp.json();
    const raw = json?.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.days?.length) throw new Error('Invalid AI response');
    return res.json(parsed);
  } catch (err) {
    console.error('Plan generation failed:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate plan' });
  }
});
// ────────────────────────────────────────────────────────────────────────────

// Only start the server when running locally (not on Vercel)
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

export default app;






