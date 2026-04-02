import type { CountryData } from '../types';

// In-memory cache to avoid repeated API calls for the same country
const countryCache = new Map<string, CountryData>();

const API_BASE = '/api/country';

/**
 * Fetch a complete country profile from the server.
 * Results are cached in memory for the session.
 */
export async function generateCountryProfile(country: string): Promise<CountryData> {
  const cacheKey = country.trim().toLowerCase();

  // Return cached data if available
  const cached = countryCache.get(cacheKey);
  if (cached) return cached;

  let res: Response | undefined;
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(`${API_BASE}?name=${encodeURIComponent(country.trim())}`);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }

  if (!res) {
    throw lastError || new Error('Failed to connect to server');
  }

  if (!res.ok) {
    if (res.status === 404) {
      return { isValidCountry: false } as CountryData;
    }
    throw new Error(`Server returned ${res.status}`);
  }

  const data: CountryData = await res.json();

  if (data && data.isValidCountry) {
    // Normalize pronunciation → phonetic for phrases if needed
    if (data.phrases && data.phrases.length > 0) {
      data.phrases = data.phrases.map((p: any) => ({
        english: p.english || '',
        local: p.local || '',
        phonetic: p.phonetic || p.pronunciation || '',
      }));
    }

    countryCache.set(cacheKey, data);
  }

  return data;
}
