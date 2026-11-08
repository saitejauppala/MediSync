# MediSync

MediSync is a production-ready healthcare discovery and hospital navigation platform built on the MERN stack. It helps patients find nearby medical facilities, compare providers, check bed availability, and access emergency and appointment workflows through a modern, security-conscious web application.

## Overview

MediSync addresses critical gaps in healthcare access by combining geospatial discovery, facility comparison, live availability insight, and role-based workflow support for patients, hospital administrators, and platform operators.

### Core capabilities
- Nearby hospital discovery with location-aware search and map/list synchronization
- Specialty-based hospital filtering across departments such as cardiology, neurology, oncology, orthopaedics, and paediatrics
- Live bed availability tracking for general, ICU, oxygen, and ventilator capacity
- Emergency care discovery with direct response guidance
- Hospital comparison matrix for side-by-side decision support
- Appointment request workflows with status tracking
- Role-based access control for patient and administrative portals

## Architecture

- Frontend: React + Vite + Redux Toolkit + Tailwind CSS
- Backend: Node.js + Express.js + Mongoose
- Database: MongoDB Atlas with geospatial indexing
- Mapping and discovery: Leaflet, geolocation services, and geocoded hospital data
- Security: JWT-based auth, bcrypt password hashing, Helmet, CORS, rate limiting

## Production deployment

This project is designed for cloud deployment using separate frontend and backend services backed by MongoDB Atlas. The recommended deployment flow is documented in [docs/RAILWAY_DEPLOYMENT.md](./docs/RAILWAY_DEPLOYMENT.md).

### Required production environment variables

Backend service:
- `NODE_ENV=production`
- `MONGODB_URI=<MongoDB Atlas connection string>`
- `JWT_SECRET=<secure secret>`
- `JWT_EXPIRE=30d`
- `FRONTEND_URL=<frontend HTTPS origin>`
- `NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org`
- `NOMINATIM_USER_AGENT=MediSync/1.0`
- `NOMINATIM_CONTACT_EMAIL=<monitoring contact email>`

Frontend service:
- `VITE_API_BASE_URL=https://<backend-domain>/api`

## Local development

### Prerequisites
- Node.js 18+
- MongoDB Atlas connection or a local MongoDB instance
- Access to an environment configuration for backend and frontend services

### Install dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Seed reference data
```bash
cd backend
npm run seed
```
This command adds the Vijayawada community dataset and missing speciality reference records in a non-destructive manner. It is intended for development and validation, not production data mutation.

### Start application services
```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

If you are running the full stack locally, configure the backend and frontend environment variables before starting the services.

## Quality and validation

Run automated checks before release:

```bash
cd backend
npm test
```

```bash
cd frontend
npm run build
```

The backend test suite validates key geospatial, authentication, and data integrity behaviors. The frontend build checks that production assets compile successfully.

## Data and safety

- Community and hospital listings should be treated as operational data, not independently verified clinical records.
- The seed script is non-destructive and does not create production data.
- Geographic and facility data should be validated before being used in patient-facing decisions.
- Bed availability and emergency service information are informational and should be confirmed directly with the relevant institution when needed.

## Security and compliance notes

- Secrets must be stored in environment variables, not committed source files.
- Production deployments should use HTTPS-only origins and restrictive network access for database services.
- Nominatim usage should be limited to explicit user-driven search flows and monitored against rate limits.
- Role-based access should be enforced for administrative and patient-specific workflows.

## Emergency medical notice

> MediSync is an informational healthcare discovery platform and not an emergency dispatch service. In critical medical situations, contact local emergency services immediately.
>
> - National emergency: 112
> - Ambulance services: 108
> - US/Canada emergency: 911

## Documentation

- [docs/RAILWAY_DEPLOYMENT.md](./docs/RAILWAY_DEPLOYMENT.md)

## License

This project is licensed under the MIT License.
