const test = require('node:test');
const assert = require('node:assert/strict');
const nominatimService = require('../src/services/nominatimService');
const { reverseGeocode: reverseGeocodeController } = require('../src/controllers/locationController');
const Hospital = require('../src/models/Hospital');
const EmergencyService = require('../src/models/EmergencyService');

test('new hospital and emergency records do not imply unreported services or capacity', () => {
  const hospital = new Hospital({
    name: 'Unverified Test Facility',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    location: { type: 'Point', coordinates: [80.648, 16.5062] },
  });
  const emergencyService = new EmergencyService({
    hospitalId: new Hospital()._id,
    ambulanceNumber: '100',
    directEmergencyHotline: '100',
  });

  assert.equal(hospital.rating, 0);
  assert.equal(hospital.reviewCount, 0);
  assert.equal(hospital.hasEmergency, false);
  assert.equal(hospital.is24x7, false);
  assert.deepEqual(hospital.facilities, []);
  assert.equal(hospital.operatingHours, 'Hours not listed');
  assert.equal(hospital.isVerified, false);
  assert.equal(emergencyService.bloodBankAvailable, false);
  assert.equal(emergencyService.traumaLevel, undefined);
  assert.equal(emergencyService.operatingStatus, undefined);
});

test('Nominatim reverse results are normalized and cached', async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.NOMINATIM_BASE_URL;
  const originalUserAgent = process.env.NOMINATIM_USER_AGENT;
  process.env.NOMINATIM_BASE_URL = 'https://nominatim.test';
  process.env.NOMINATIM_USER_AGENT = 'MediSync test/1.0';

  let requestCount = 0;
  global.fetch = async (url, options) => {
    requestCount += 1;
    assert.match(url.toString(), /\/reverse\?/);
    assert.equal(options.headers['User-Agent'], 'MediSync test/1.0');
    return {
      ok: true,
      json: async () => ({
        place_id: 123,
        display_name: 'Vijayawada, Andhra Pradesh, India',
        lat: '16.5062',
        lon: '80.6480',
        address: { city: 'Vijayawada' },
      }),
    };
  };

  try {
    const first = await nominatimService.reverseGeocode(16.5062, 80.648);
    const second = await nominatimService.reverseGeocode(16.5062, 80.648);
    assert.deepEqual(first, second);
    assert.equal(first.latitude, 16.5062);
    assert.equal(first.longitude, 80.648);
    assert.equal(requestCount, 1);
  } finally {
    global.fetch = originalFetch;
    if (originalBaseUrl === undefined) delete process.env.NOMINATIM_BASE_URL;
    else process.env.NOMINATIM_BASE_URL = originalBaseUrl;
    if (originalUserAgent === undefined) delete process.env.NOMINATIM_USER_AGENT;
    else process.env.NOMINATIM_USER_AGENT = originalUserAgent;
  }
});

test('reverse geocoding rejects invalid coordinates before contacting Nominatim', async () => {
  let statusCode;
  let responseBody;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await reverseGeocodeController(
    { query: { latitude: '91', longitude: '80' } },
    response,
    (error) => {
      throw error;
    }
  );

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
});

test('location search is explicit and bounded to the Vijayawada search area', async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.NOMINATIM_BASE_URL;
  process.env.NOMINATIM_BASE_URL = 'https://nominatim-search.test';
  let requestUrl;

  global.fetch = async (url) => {
    requestUrl = new URL(url);
    return {
      ok: true,
      json: async () => [{
        place_id: 456,
        display_name: 'Benz Circle, Vijayawada, Andhra Pradesh',
        lat: '16.50',
        lon: '80.64',
      }],
    };
  };

  try {
    const places = await nominatimService.searchPlaces('Benz Circle');
    assert.equal(places.length, 1);
    assert.equal(places[0].latitude, 16.5);
    assert.equal(requestUrl.pathname, '/search');
    assert.equal(requestUrl.searchParams.get('bounded'), '1');
    assert.equal(requestUrl.searchParams.get('countrycodes'), 'in');
    assert.match(requestUrl.searchParams.get('q'), /Vijayawada/);
  } finally {
    global.fetch = originalFetch;
    if (originalBaseUrl === undefined) delete process.env.NOMINATIM_BASE_URL;
    else process.env.NOMINATIM_BASE_URL = originalBaseUrl;
  }
});
