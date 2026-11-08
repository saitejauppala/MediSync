# MediSync System Architecture (MERN Stack)

## 1. Overview & Technology Alignment

MediSync is a full-stack healthcare discovery and hospital navigation platform built strictly on the **MERN** stack:
- **Database**: MongoDB (with MongoDB Atlas support and local resilient memory failover) + Mongoose ODM
- **Backend Framework**: Express.js REST API
- **Frontend Framework**: React.js 18+ (Vite, Tailwind CSS, React Router v6, Redux Toolkit, Framer Motion, Lucide React)
- **Runtime Environment**: Node.js v26 LTS

## 2. Layered Backend Architecture

```
backend/
├── src/
│   ├── config/          # Database (native + memory fallback) and Environment configuration
│   ├── models/          # 10 Mongoose Schemas (User, Hospital, BedInventory, Appointment, etc.)
│   ├── routes/          # RESTful Endpoint Definitions
│   ├── controllers/     # Request/Response HTTP handling
│   ├── services/        # Pure Business Logic & DB queries
│   ├── middleware/      # JWT Authentication, RBAC, Centralized Error Handling, Rate Limiting
│   ├── validators/      # Schema & Parameter input validation
│   ├── utils/           # Haversine Geodesic Math & Helpers
│   └── constants/       # Enums for Roles, Statuses, Specialities
```

### Geospatial Indexing
- Hospital locations are stored in strict GeoJSON format:
  ```json
  {
    "type": "Point",
    "coordinates": [longitude, latitude]
  }
  ```
- Backed by MongoDB `2dsphere` indexes.
- Distance calculations utilize `$near` geospatial operators and Haversine geodesic validation in kilometers.

## 3. Frontend Architecture

```
frontend/
├── src/
│   ├── components/      # Common, Layout, Hospital Cards, Leaflet Dark Maps, Modals
│   ├── pages/           # Home, Hospitals Discovery, HospitalDetails, Emergency, Specialities, Compare, Dashboards
│   ├── context/         # AuthContext & CompareContext
│   ├── store/           # Redux Toolkit Slices (authSlice, hospitalSlice, compareSlice)
│   ├── services/        # Centralized Axios API client and feature services
│   ├── hooks/           # useGeolocation and reactive hooks
│   └── routes/          # ProtectedRoute component with Role-Based Access Control
```

## 4. Design System Tokens (70% Black, 20% White, 10% Red)

- Background: `#090909`
- Secondary Background: `#111111`
- Cards: `#171717`
- Elevated / Modals: `#202020`
- Borders: `#303030`
- Primary Text: `#FFFFFF`
- Secondary Text: `#A3A3A3`
- Medical Red: `#E53935` (Palettes: `red-50` through `red-950`)
