# Railway deployment

MediSync uses two Railway services and MongoDB Atlas. No service is deployed by this repository's local commands.

## 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas database and a dedicated application database user.
2. Copy the application connection URI into Railway's backend variables as `MONGODB_URI`.
3. Configure Atlas Network Access for the intended Railway egress strategy. Avoid opening Atlas to the entire internet where your Atlas plan supports a narrower option.
4. Take a database backup before applying schema or data changes.

The app does not create or replace production data on startup. `npm run seed` is disabled in production and only adds missing Vijayawada OpenStreetMap entries and speciality references in development.

## 2. Create the backend service

- Connect the GitHub repository and set the service root directory to `/backend`.
- Use `backend/railway.json`, or configure:
  - Build: `npm ci`
  - Start: `npm start`
  - Health check: `/api/health`
- Generate a Railway public domain and set the following variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | MongoDB Atlas application URI |
| `JWT_SECRET` | Cryptographically random secret, at least 32 characters |
| `JWT_EXPIRE` | Optional; defaults to `30d` |
| `FRONTEND_URL` | Exact HTTPS origin of the deployed frontend (no path) |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` |
| `NOMINATIM_USER_AGENT` | Descriptive app/version, e.g. `MediSync/1.0` |
| `NOMINATIM_CONTACT_EMAIL` | Monitored contact email for the application operator |

Railway supplies `PORT`; the server binds to `0.0.0.0`. Production startup fails when required secrets, database URI, frontend origin, or the Nominatim contact email are missing.

## 3. Create the frontend service

- Create a second service from the same repository and set its root directory to `/frontend`.
- Use `frontend/railway.json`, or configure:
  - Build: `npm ci && npm run build`
  - Start: `npm run start`
  - Health check: `/`
- Set `VITE_API_URL` before the build to the backend HTTPS origin, without an `/api` suffix (for example, `https://<backend-public-domain>`). The API client appends and normalizes `/api`.
- Generate a frontend Railway public domain.
- Set backend `FRONTEND_URL` to the exact frontend HTTPS origin (for example, `https://energetic-patience-production-3e23.up.railway.app`) and redeploy the backend if needed. Bearer-token authentication does not use cross-origin cookies, so credentialed CORS requests are not enabled.

Vite embeds the API base URL during the frontend build. It must not contain secrets.

For the currently deployed MediSync services, configure:

| Service | Variable | Value |
|---|---|---|
| Frontend | `VITE_API_URL` | `https://medisync-production-d996.up.railway.app` |
| Backend | `FRONTEND_URL` | `https://energetic-patience-production-3e23.up.railway.app` |

Keep existing backend secrets and database/geocoding variables unchanged when applying these values.

## 4. Verify deployment

1. Confirm `https://<backend-domain>/api/health` returns `status: "ok"`, `service: "medisync-api"`, and an ISO timestamp.
2. Open the frontend domain directly on `/`, `/hospitals`, `/emergency`, and a hospital detail URL to verify SPA fallback.
3. Verify browser developer tools show successful HTTPS API requests and no CORS errors.
4. Test login and role-protected routes using intended non-production accounts.
5. Test Vijayawada hospital search, filters, nearby results, location permission denial, explicit locality search, map tile rendering, and directions.
6. Confirm Nominatim is contacted only after explicit location search or opted-in location use; check backend logs for upstream failures.
7. Check Railway service logs and MongoDB Atlas connection health.
8. Do not treat community listings, reported bed inventory, emergency services, or geocoded addresses as independently verified.

The app's default map layer uses CARTO's dark basemap and includes OpenStreetMap/CARTO attribution. It does not use Google Maps JavaScript or a Google Maps API key. The public OpenStreetMap tile server is not configured as the default production tile source; select a provider appropriate to expected traffic and its terms before scaling.

The Nominatim throttle/cache is per backend process. Keep a single backend instance when using the public Nominatim endpoint, or switch to a provider/shared rate-limit strategy before scaling to multiple instances. Do not use the public service for autocomplete or unrestricted/bulk geocoding.

## 5. Rollback

1. In Railway, redeploy the last known-good deployment for the affected service.
2. If a database migration was applied, restore the pre-migration Atlas backup or run a separately reviewed corrective migration. The included location migration only adds GeoJSON fields and does not delete records.
3. Re-check the API health endpoint, frontend routes, and service logs after rollback.

## Local checks

```powershell
npm --prefix backend test
npm run build:frontend
npm --prefix frontend start
```

For backend startup locally, configure `backend/.env` and run `npm --prefix backend start`. Never put production secrets in committed files.
