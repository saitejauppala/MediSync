const DEFAULT_BASE_URL = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const MIN_REQUEST_INTERVAL_MS = 1000;

const cache = new Map();
let requestQueue = Promise.resolve();
let lastRequestAt = 0;

const getBaseUrl = () => (process.env.NOMINATIM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

const fromCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return cached.value;
};

const saveCache = (key, value) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const requestNominatim = async (url) => {
  const cacheKey = url.toString();
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const request = requestQueue.then(async () => {
    const cachedAfterQueue = fromCache(cacheKey);
    if (cachedAfterQueue) return cachedAfterQueue;

    const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    lastRequestAt = Date.now();
    const contact = process.env.NOMINATIM_CONTACT_EMAIL;
    const userAgent = process.env.NOMINATIM_USER_AGENT || 'MediSync/1.0';
    const headers = {
      'User-Agent': contact ? `${userAgent} (contact: ${contact})` : userAgent,
      Accept: 'application/json',
    };

    let response;
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      const upstreamError = new Error(`Nominatim request failed: ${error.message}`, { cause: error });
      upstreamError.statusCode = 502;
      throw upstreamError;
    }

    if (!response.ok) {
      const upstreamError = new Error(`Nominatim returned HTTP ${response.status}.`);
      upstreamError.statusCode = 502;
      throw upstreamError;
    }

    const result = await response.json();
    saveCache(cacheKey, result);
    return result;
  });

  requestQueue = request.catch(() => undefined);
  return request;
};

const normalizePlace = (place) => {
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (
    !place.display_name
    || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    throw new Error('Nominatim returned an invalid location result.');
  }

  return {
    placeId: String(place.place_id),
    displayName: place.display_name,
    latitude,
    longitude,
    type: place.type || '',
    address: place.address || {},
  };
};

const reverseGeocode = async (latitude, longitude) => {
  const url = new URL(`${getBaseUrl()}/reverse`);
  url.search = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    lat: String(latitude),
    lon: String(longitude),
  }).toString();
  const result = await requestNominatim(url);
  return normalizePlace(result);
};

const searchPlaces = async (query) => {
  const url = new URL(`${getBaseUrl()}/search`);
  url.search = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'in',
    q: `${query}, Vijayawada, Andhra Pradesh`,
    viewbox: '80.52,16.58,80.78,16.43',
    bounded: '1',
  }).toString();
  const results = await requestNominatim(url);
  return results.map(normalizePlace);
};

module.exports = {
  reverseGeocode,
  searchPlaces,
};
