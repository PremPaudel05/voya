export interface CountryData {
  isValidCountry: boolean;
  overview: {
    countryName: string;
    flagEmoji: string;
    countryCode: string;
    flagUrl: string;
    capital: string;
    population: string;
    currency: string;
    currencyCode: string;
    exchangeRateToUSD: number;
    timeZone: string;
  };
  geography: {
    climate: string;
    landscape: string;
    majorCities: string[];
    naturalLandmarks: string[];
  };
  culture: {
    traditions: string[];
    socialNorms: string[];
    religionOverview: string;
    etiquetteTips: string[];
    note?: string;
  };
  foods: {
    name: string;
    description: string;
    famousFor: string;
    source?: { title: string; url: string };
  }[];
  festivals?: {
    year: number;
    highlights: { name: string; timing: string; source: { title: string; url: string } }[];
    calendar: {
      name: string;
      dates: string[];
      kind: 'public' | 'observance' | 'optional';
      dateNote?: string;
      source: { title: string; url: string };
    }[];
    note: string;
    sources: { title: string; url: string }[];
    attribution?: { title: string; url: string; licenseUrl: string; noticesUrl: string };
  };
  foodsNote?: string;
  contentVersion?: string;
  contentSources?: {
    food: { title: string; url: string }[];
    culture: { title: string; url: string }[];
  };
  attractions: {
    name: string;
    city: string;
    famousFor: string;
    interestingFact: string;
    imageSearchQuery: string;
    imageUrl?: string;
  }[];
  languageCode: string;
  phrases: {
    english: string;
    local: string;
    phonetic: string;
  }[];
  prices: {
    hotel: string;
    meal: string;
    streetFood: string;
    coffee: string;
    transport: string;
    taxi: string;
  };
  bestTimeToVisit: {
    bestMonths: string;
    rainySeason: string;
    cheapestSeason: string;
    majorFestivals: string[];
  };
  funFacts: string[];
  mapData: {
    countryQuery: string;
    cities: {
      name: string;
      query: string;
      highlights: string[];
    }[];
    bestBeaches: string[];
    bestFoodAreas: string[];
    nightlifeZones: string[];
    instagrammableSpots: string[];
    areasToAvoid: string[];
  };
}
