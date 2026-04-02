export interface CountryData {
  isValidCountry: boolean;
  overview: {
    flagEmoji: string;
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
  };
  foods: {
    name: string;
    description: string;
    famousFor: string;
  }[];
  attractions: {
    name: string;
    city: string;
    famousFor: string;
    interestingFact: string;
    imageSearchQuery: string;
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