# MediSync: Full-Stack Healthcare Discovery & Hospital Navigation Platform

MediSync is a modern, scalable, and responsive healthcare discovery web application built exclusively on the **MERN** stack (**M**ongoDB Atlas, **E**xpress.js, **R**eact.js, **N**ode.js).

---

## 1. Project Vision & Core Solutions

MediSync solves acute challenges in healthcare accessibility:
- **Nearby Hospital Discovery**: Real-time geospatial location detection (`2dsphere` GeoJSON `[longitude, latitude]`) with interactive map and list synchronization.
- **Medical Speciality Matching**: Comprehensive directory across 12 clinical specialities (Cardiology, Neurology, Orthopaedics, Paediatrics, Oncology, etc.).
- **Live Bed Availability**: Hospital-reported bed inventory with total, occupied, available, ICU, oxygen, and ventilator capacities.
- **24/7 Emergency Care Finder**: Direct routing to trauma centers with one-touch emergency calling.
- **3-Hospital Side-by-Side Comparison Matrix**: Deep multi-parameter facility comparison.
- **Online Appointment Requests & Status Tracking**: Seamless patient-to-hospital scheduling workflows.
- **Role-Based Access Control (RBAC)**: Dedicated portals for Patients, Hospital Administrators, and Platform Administrators.

---

## 2. Technology Stack (Strictly MERN)

- **Database**: MongoDB (Atlas connection string support + automatic resilient local failover) via **Mongoose**.
- **Backend Framework**: **Node.js** & **Express.js** REST API with layered architecture (Routes -> Controllers -> Services -> Models).
- **Frontend Framework**: **React.js** (Vite, Tailwind CSS, React Router v6, Redux Toolkit, Framer Motion, Lucide React).
- **Maps**: Interactive dark-themed Leaflet & CartoDB tiles with custom medical markers and Google Maps turn-by-turn routing.
- **Security**: JWT tokens, bcrypt password hashing, Helmet, CORS, and Express-Rate-Limit.

---

## 3. Design System (Black, White, and Red)

MediSync adheres strictly to a 70% Black, 20% White, and 10% Red aesthetic:
- **Background**: `#090909`
- **Secondary Surfaces**: `#111111`
- **Cards**: `#171717`
- **Elevated Modals**: `#202020`
- **Borders**: `#303030`
- **Primary Text**: `#FFFFFF`
- **Secondary Text**: `#A3A3A3`
- **Medical Emergency Red**: `#E53935` (Palette: `red-50` through `red-950`)

---

## 4. Default Seed Accounts (One-Click Evaluator Login)

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Patient** | `patient@medisync.io` | `Password123!` | Discovery, Appointment Requests, Saved Facilities |
| **Hospital Admin** | `hospitaladmin@medisync.io` | `Password123!` | Bed Inventory Management, Appointment Approvals |
| **Platform Admin** | `admin@medisync.io` | `Password123!` | Facility Verification, Analytics, User Management |

*(The login screen also features convenient 1-click demo switcher pills for instant role toggling during evaluation)*

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js v18+ (Node.js v26 LTS recommended)
- MongoDB running locally or a MongoDB Atlas connection URI

### 1. Database Seeding
To populate verified healthcare facilities, medical departments, and demo accounts:
```bash
cd backend
npm run seed
```

### 2. Start the Backend API (Port 5000)
```bash
cd backend
npm start
```
*Health check available at: `http://localhost:5000/api/health`*

### 3. Start the Frontend Application (Port 5173)
```bash
cd frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 6. Running Tests

Execute the automated backend test suite:
```bash
cd backend
npm test
```
The test suite verifies:
- Geolocation Haversine math calculations
- Bcrypt password hashing
- MongoDB GeoJSON `2dsphere` coordinates storage
- Bed inventory mathematical validation constraints
- MongoDB `$near` geospatial query execution

---

## 7. Emergency Medical Notice

> **Important Clinical Disclaimer**: MediSync is an informational discovery platform, not an emergency response dispatch service. In critical emergencies, contact national emergency services immediately:
> - **National Emergency**: Dial `112`
> - **Ambulance Services**: Dial `108`
> - **US/Canada Emergency**: Dial `911`
