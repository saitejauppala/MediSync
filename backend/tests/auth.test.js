const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'https://energetic-patience-production-3e23.up.railway.app';

const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;
let server;
let baseUrl;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

test('configured frontend origin passes the API CORS preflight', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: process.env.FRONTEND_URL,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), process.env.FRONTEND_URL);
  assert.match(response.headers.get('access-control-allow-methods'), /POST/);
  assert.match(response.headers.get('access-control-allow-headers'), /authorization/i);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});

test('patient and hospital administrator registration and login use the mounted API routes', async () => {
  const suffix = Date.now();
  const patientCredentials = {
    name: 'API Test Patient',
    email: `api-patient-${suffix}@medisync.test`,
    password: 'SecurePassword123!',
    role: 'patient',
  };
  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientCredentials),
  });

  assert.equal(registration.status, 201);
  const registeredPatient = await registration.json();
  assert.equal(registeredPatient.user.role, 'patient');
  assert.ok(registeredPatient.token);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: patientCredentials.email,
      password: patientCredentials.password,
    }),
  });
  assert.equal(login.status, 200);
  const loggedInPatient = await login.json();
  assert.equal(loggedInPatient.user.role, 'patient');
  assert.ok(loggedInPatient.token);

  const hospitalEmail = `api-hospital-${suffix}@medisync.test`;
  const hospitalRegistration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...patientCredentials,
      name: 'API Test Hospital Administrator',
      email: hospitalEmail,
      role: 'hospital_admin',
    }),
  });
  assert.equal(hospitalRegistration.status, 201);
  assert.equal((await hospitalRegistration.json()).user.role, 'hospital_admin');

  const hospitalLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: hospitalEmail,
      password: patientCredentials.password,
    }),
  });
  assert.equal(hospitalLogin.status, 200);
  assert.equal((await hospitalLogin.json()).user.role, 'hospital_admin');

  const escalatedRegistration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...patientCredentials,
      name: 'API Test Restricted Registration',
      email: `api-restricted-${suffix}@medisync.test`,
      role: 'platform_admin',
    }),
  });
  assert.equal(escalatedRegistration.status, 201);
  assert.equal((await escalatedRegistration.json()).user.role, 'patient');

  const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: patientCredentials.email,
      password: 'incorrect-password',
    }),
  });
  assert.equal(invalidLogin.status, 401);
});

test('protected profile requires a valid token and the admin route enforces roles', async () => {
  const user = await User.create({
    name: 'API Test Platform Administrator',
    email: `api-platform-${Date.now()}@medisync.test`,
    password: 'SecurePassword123!',
    role: 'platform_admin',
  });

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'SecurePassword123!' }),
  });
  assert.equal(login.status, 200);
  const adminSession = await login.json();

  const unauthenticated = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(unauthenticated.status, 401);

  const profile = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${adminSession.token}` },
  });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).user.role, 'platform_admin');

  const adminRoute = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminSession.token}` },
  });
  assert.equal(adminRoute.status, 200);
});

test('API mount does not duplicate the /api prefix', async () => {
  const response = await fetch(`${baseUrl}/api/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unknown@medisync.test', password: 'invalid' }),
  });

  assert.equal(response.status, 404);
});
