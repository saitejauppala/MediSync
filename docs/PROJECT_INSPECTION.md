# MediSync project inspection and implementation report

## Scope decision

Discovery remains restricted to Vijayawada, as selected for this task. GPS and manual locality/PIN-code location search are opt-in and only center the search; the public directory does not return hospitals outside Vijayawada.

## Existing architecture

- **Frontend:** React 18, Vite, Tailwind, React Router, Redux Toolkit, Axios, React Leaflet, and Leaflet. Pages cover home, hospital discovery/details, speciality discovery, emergency search, comparison, sign-in/up, patient and hospital dashboards, and platform administration.
- **Backend:** Express REST API with controllers, Mongoose models, authentication/RBAC middleware, validation helpers, and service modules.
- **Database:** MongoDB with a hospital GeoJSON `[longitude, latitude]` field and a `2dsphere` index. Development has an in-memory fallback; production now requires the configured MongoDB URI.
- **External map layer:** Leaflet with CARTO's dark basemap and OSM/CARTO attribution. Directions open a coordinate/address-based Google Maps URL; the application does not load Google Maps JavaScript.
- **Existing automated coverage:** Five backend tests for distance math, password hashing, GeoJSON, bed-inventory validation, and nearby geospatial queries. There was no frontend test suite or Railway service configuration in the inspected repository.

## Map key investigation

The exact string `API KEY REQUIRED`, Google Maps JavaScript API, and a Google Maps API key reference were not found in the repository. The active map component uses Leaflet and a CARTO raster tile URL, which does not require a Google Maps API key. That message therefore appears to originate from a different/stale page or an externally configured map/tile provider; this repository alone does not identify which external page produced it.

## Initial gaps found and addressed

| Area | Inspection finding | Changes in this task |
|---|---|---|
| Location search | No Nominatim integration or location API existed. | Added explicit forward/reverse geocoding, input validation, bounded Vijayawada search, cache, timeout, descriptive User-Agent/contact, request serialization, and per-client rate limiting. |
| Nearby filters | Coordinates and radius were weakly validated; radius was not capped; sorting and nearby pagination were incomplete. | Added bounded coordinates/radii/page sizes, escaped search terms, district/locality filters, verified-only filtering, supported sorts, and pagination. |
| Location UX | GPS worked but there was no manual locality selection; location and hospital search were separate concerns. | Added explicit locality/PIN search results, reverse-geocoded GPS labels, radius options, graceful error feedback, and nearby list/map focus synchronization. |
| Database integrity | New hospital defaults could imply ratings, emergency care, operating hours, and facilities that had not been supplied. | Changed new-record defaults to neutral/unlisted values and added GeoJSON coordinate validation. Existing records are not rewritten. |
| Seeding | The previous seed script deleted collections and inserted synthetic hospital, bed, review, appointment, and account data. | Replaced it with a development-only, idempotent importer for Vijayawada OSM records and speciality references. It requires an explicit database URI and never deletes existing records. |
| Migration | No legacy coordinate migration existed. | Added a dry-run-first, non-destructive coordinate migration with an explicit `--apply` flag and an index creation step. It has not been run against the user's database. |
| Production configuration | CORS was wildcarded, JWT had a known fallback secret, MongoDB errors fell back to in-memory storage, and the health response did not follow the requested shape. | Restricted production CORS, rejected missing/short production secrets and configuration, disabled production memory fallback, limited request bodies, hid unexpected production errors, and standardized `/api/health`. |
| Railway | No per-service Railway configs or production frontend static server existed; the backend had no lockfile. | Added separate frontend/backend configs, static serving with SPA fallback, backend lockfile, service environment examples, and deployment/rollback instructions. |

## Project layout

```text
frontend/
  src/components/       Shared cards, layout, controls, and Leaflet map
  src/pages/            Discovery, emergency, comparison, auth, and dashboards
  src/services/         Axios API services
  server.js             Production static server and SPA fallback
  railway.json          Railway frontend build/start/health configuration
backend/
  src/controllers/      REST request handlers
  src/models/           Mongoose schemas and GeoJSON index
  src/routes/           API route registration
  src/services/         Business logic and Nominatim adapter
  src/scripts/          Safe seed/import and coordinate migration
  railway.json          Railway backend build/start/health configuration
docs/
  API_DOCUMENTATION.md
  ARCHITECTURE.md
  PROJECT_INSPECTION.md
  RAILWAY_DEPLOYMENT.md
```

## Database and data safety

- The new `district` field and coordinate validators are schema-level changes; existing documents are preserved.
- `migrate:hospital-locations` inspects legacy `latitude`/`longitude`, `lat`/`lng`, or `lat`/`lon` fields. It defaults to a report-only dry run. Run with `-- --apply` only after reviewing the report and backing up the target database.
- The migration never deletes records and only writes GeoJSON where `location` is absent and valid legacy coordinates exist. Existing malformed `location` values are reported for manual review.
- The new seed command upserts only the community-sourced Vijayawada records and speciality reference data. It does not mark a listing verified or create demo accounts/reviews/inventory.
- The earlier sample data already present in any database is not automatically removed or corrected. The seed and migration commands were not run on the current database.

## Railway deployment requirements

Deploy separate Railway services with `/frontend` and `/backend` as their respective root directories. MongoDB remains external in Atlas. Configure `MONGODB_URI`, a strong `JWT_SECRET`, exact `FRONTEND_URL`, and a real monitored `NOMINATIM_CONTACT_EMAIL` on the backend; set `VITE_API_URL` to the backend HTTPS API origin before building the frontend. Railway supplies `PORT`; both services bind to `0.0.0.0`.

The backend health check is `/api/health`; the frontend health check is `/`. Detailed service setup, smoke tests, Atlas networking guidance, and rollback steps are in [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md). No Railway or Atlas deployment was performed.

## Files created or added for this implementation

- `backend/package-lock.json`
- `backend/railway.json`
- `backend/src/controllers/locationController.js`
- `backend/src/data/departments.js`
- `backend/src/routes/locationRoutes.js`
- `backend/src/scripts/migrateHospitalLocations.js`
- `backend/src/services/nominatimService.js`
- `backend/tests/location.test.js`
- `docs/PROJECT_INSPECTION.md`
- `docs/RAILWAY_DEPLOYMENT.md`
- `frontend/railway.json`
- `frontend/server.js`

## Known limitations and unverified items

- Nominatim tests use a mocked fetch. No external Nominatim request was made; production requires the operator's contact email.
- Nominatim throttling and caching are in-process. Use one backend instance with the public service, or change provider/shared rate-limit strategy before scaling.
- The map layer uses CARTO's dark tile service. Its usage terms and capacity should be confirmed for expected production traffic; a production tile provider can be substituted without changing the map component's geospatial model.
- The original `API KEY REQUIRED` source could not be established from this codebase.
- No live migration, seed import, Railway deployment, Atlas connection, authenticated end-to-end flow, frontend test suite, or 500-user load test was performed.
- Broader admin workflows such as safeguarded hospital deletion and a full missing-coordinate review UI remain outside this implementation.
- The Vite production build still emits a large JavaScript chunk warning.

## Worktree note

The repository already had many modified and untracked files before this task. Those existing changes were preserved; the implementation touched only the related MediSync, deployment, and documentation surfaces described above.
