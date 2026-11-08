# MediSync REST API Documentation

Base URL: `https://<backend-origin>/api` (locally, use the backend origin configured for development).

The production API uses the configured Railway backend origin. Validation failures use a `400` response; unexpected production errors do not expose stack traces or internal messages.

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

## Location (`/api/location`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/reverse?latitude=&longitude=` | Public, rate-limited | Reverse geocode opt-in device coordinates through Nominatim |
| `GET` | `/search?q=` | Public, rate-limited | Explicit location search bounded to Vijayawada (not autocomplete) |

Location responses are cached in process for 24 hours, requests are serialized to one Nominatim request per second per backend process, and upstream requests use the configured descriptive User-Agent/contact email. Coordinates are used for the request and are not persisted to the database; a cache miss requires network access to Nominatim.

## Hospitals (`/api/hospitals`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | List hospitals with filters (speciality, type, 24x7, emergency, search) |
| `GET` | `/nearby` | Public | Geospatial search using `?longitude=&latitude=&maxDistance=` |
| `GET` | `/search` | Public | Keyword search; frontend submits only after explicit user action |
| `GET` | `/compare` | Public | Compare up to 3 hospitals using `?ids=id1,id2,id3` |
| `GET` | `/:id` | Public | Detailed hospital profile by ID or slug |
| `POST` | `/` | Admin | Register new facility (requires verification) |
| `PATCH` | `/:id` | Admin | Update hospital profile details |
| `GET` | `/:id/beds` | Public | Get hospital reported bed inventory |
| `GET` | `/:id/reviews` | Public | List verified patient reviews |
| `POST` | `/:id/reviews` | Private | Submit patient review and rating |

Public hospital discovery, nearby, search, compare, detail, and emergency listings are restricted to Vijayawada. Listings include verified facilities and clearly marked, unverified OpenStreetMap community entries. Community entries do not expose hospital-reported beds, appointments, or reviews. Nearby results require device coordinates and include distance; location access is requested by the client only after the user opts in. New hospital registrations must specify Vijayawada. `page` and `limit` are bounded; search terms are escaped and length-limited. Supported list sorts are rating, reviews, name, and recent; nearby sorting also supports nearest. Radius options are 1, 5, 10, 25, and 50 km.

OpenStreetMap community entries are distributed under the Open Database License (ODbL). Attribution: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Confirm community-sourced addresses and service information directly with the facility before travelling.

## Emergency Care (`/api/emergency`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/nearby` | Public | Query hospital-listed emergency facilities, optionally sorted by distance; capacity is not guaranteed |

## Bed Inventory (`/api/beds`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/:id` | Public | Get hospital bed availability |
| `PATCH` | `/:id` | Hospital/Platform Admin | Update bed availability and notify patients who saved the hospital |

Bed availability is never generated from sample values. A `GET` returns `404` until the hospital reports its capacity. An authorized hospital administrator can create the first report by submitting complete, non-negative counts; updates trigger in-app notifications to patients who saved that facility, and the response states how many received the broadcast.

## Appointments (`/api/appointments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Patient | Submit appointment request |
| `GET` | `/my` | Patient | Get patient's appointments |
| `GET` | `/hospital/:id` | Hospital Admin | View incoming requests for facility |
| `PATCH` | `/:id/status` | Hospital Admin | Update status (`confirmed`, `rejected`, `completed`) |
| `DELETE` | `/:id` | Private | Cancel appointment request |

Appointment submissions are requests, not confirmed bookings. Patients receive an in-app notification when submitted and another when the hospital changes the status.

## Platform Administration (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/analytics` | Platform Admin | System KPIs and operational metrics |
| `GET` | `/hospitals` | Platform Admin | Hospital verification queue |
| `PATCH` | `/hospitals/:id/verification` | Platform Admin | Approve or reject hospital registration |
| `GET` | `/users` | Platform Admin | User accounts directory |
| `PATCH` | `/users/:id/status` | Platform Admin | Toggle user active/deactivated status |
| `GET` | `/audit-logs` | Platform Admin | Immutable audit log trail |
