# MediSync REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register new patient or hospital admin |
| `POST` | `/login` | Public | Login with email and password, returns JWT |
| `POST` | `/logout` | Public | Clear session on client |
| `GET` | `/me` | Private | Retrieve current user profile and bookmarks |
| `PUT` | `/profile` | Private | Update name, phone, or avatar |
| `PUT` | `/password` | Private | Update current password |
| `POST` | `/saved-hospitals/:id` | Private | Toggle hospital bookmark |

## Hospitals (`/api/hospitals`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | List hospitals with filters (speciality, type, 24x7, emergency, search) |
| `GET` | `/nearby` | Public | Geospatial search using `?longitude=&latitude=&maxDistance=` |
| `GET` | `/search` | Public | Autocomplete and keyword search |
| `GET` | `/compare` | Public | Compare up to 3 hospitals using `?ids=id1,id2,id3` |
| `GET` | `/:id` | Public | Detailed hospital profile by ID or slug |
| `POST` | `/` | Admin | Register new facility (requires verification) |
| `PATCH` | `/:id` | Admin | Update hospital profile details |
| `GET` | `/:id/beds` | Public | Get hospital reported bed inventory |
| `GET` | `/:id/reviews` | Public | List verified patient reviews |
| `POST` | `/:id/reviews` | Private | Submit patient review and rating |

## Emergency Care (`/api/emergency`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/nearby` | Public | Query 24/7 emergency facilities sorted by distance |

## Bed Inventory (`/api/beds`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/:id` | Public | Get hospital bed availability |
| `PATCH` | `/:id` | Hospital/Platform Admin | Update total, occupied, available, ICU, oxygen beds |

## Appointments (`/api/appointments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Patient | Submit appointment request |
| `GET` | `/my` | Patient | Get patient's appointments |
| `GET` | `/hospital/:id` | Hospital Admin | View incoming requests for facility |
| `PATCH` | `/:id/status` | Hospital Admin | Update status (`confirmed`, `rejected`, `completed`) |
| `DELETE` | `/:id` | Private | Cancel appointment request |

## Platform Administration (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/analytics` | Platform Admin | System KPIs and operational metrics |
| `GET` | `/hospitals` | Platform Admin | Hospital verification queue |
| `PATCH` | `/hospitals/:id/verification` | Platform Admin | Approve or reject hospital registration |
| `GET` | `/users` | Platform Admin | User accounts directory |
| `PATCH` | `/users/:id/status` | Platform Admin | Toggle user active/deactivated status |
| `GET` | `/audit-logs` | Platform Admin | Immutable audit log trail |
