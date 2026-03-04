/**
 * Geocoding utilities for converting city names to coordinates.
 * Uses Open-Meteo Geocoding API (free, no API key required).
 * Enables app to work without Location Services (App Store Guideline 5.1.5).
 */

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Search for cities by name and return coordinates.
 * @param {string} query - City name or search query (e.g. "London", "New York")
 * @param {number} limit - Max results to return (default 5)
 * @returns {Promise<Array<{name: string, state: string, latitude: number, longitude: number, country: string, displayName: string}>>}
 */
export const searchCity = async (query, limit = 5) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const url = `${GEOCODING_API}?name=${encodeURIComponent(query.trim())}&count=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((r) => {
      const city = r.name || '';
      const state = r.admin1 || r.admin2 || '';
      const country = r.country || '';
      const parts = [city];
      if (state) parts.push(state);
      if (country) parts.push(country);
      const displayName = parts.join(', ');
      return {
        name: city,
        state,
        latitude: r.latitude,
        longitude: r.longitude,
        country,
        displayName: displayName || city,
      };
    });
  } catch (error) {
    console.warn('Geocoding error:', error);
    return [];
  }
};
