# 🚛 SafaiSaathi Backend API

RESTful backend service for **SafaiSaathi — Intelligent Municipal Waste Collection & Fleet Dispatch Platform**.

Stores and manages persistent municipal data for:
- 👤 **Drivers** (`/api/drivers`)
- 🚛 **Vehicles & Telematics** (`/api/vehicles`)
- 📋 **Pickup Requests & Proofs** (`/api/requests`)
- 🏭 **Processing Facilities** (`/api/facilities`)
- 📍 **Municipal Depots & GIS Locations** (`/api/locations`)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start
# or development mode with auto-reload:
npm run dev
```
The server will start on **`http://localhost:5001`**.

---

## 📡 API Endpoints

### 👤 Driver Management (`/api/drivers`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/drivers` | List all drivers (supports `?status=ON_DUTY` & `?shift=MORNING`) |
| `GET` | `/api/drivers/:id` | Get driver details by ID |
| `POST` | `/api/drivers` | Register a new driver profile |
| `PUT` | `/api/drivers/:id` | Update driver profile / vehicle assignment |
| `DELETE` | `/api/drivers/:id` | Delete a driver record |

### 🚛 Vehicle & Fleet Management (`/api/vehicles`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | List all fleet vehicles with real-time GPS & capacity |
| `GET` | `/api/vehicles/:id` | Get vehicle details by ID |
| `POST` | `/api/vehicles` | Register a new municipal vehicle |
| `PUT` | `/api/vehicles/:id` | Update vehicle information |
| `PATCH` | `/api/vehicles/:id/location` | Update live vehicle GPS position (`{ latitude, longitude, speed }`) |
| `PATCH` | `/api/vehicles/:id/status` | Update vehicle operational status (`AVAILABLE`, `EN_ROUTE`, etc.) |
| `DELETE` | `/api/vehicles/:id` | Remove a vehicle from fleet |

### 📋 Waste Pickup Requests (`/api/requests`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/requests` | List all waste requests |
| `GET` | `/api/requests/:id` | Get single request details |
| `POST` | `/api/requests` | Ingest new citizen or IoT bin request |
| `PUT` | `/api/requests/:id` | Update request details |
| `PATCH` | `/api/requests/:id/status` | Update request review / dispatch status |
| `POST` | `/api/requests/:id/proof` | Driver proof upload & weigh-in confirmation |

### 🏭 Facilities & Depots (`/api/facilities`, `/api/locations`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/facilities` | List MRF plants, waste-to-energy centers & recycling hubs |
| `GET` | `/api/locations` | List canonical municipal GIS locations & depots |
| `GET` | `/api/health` | Backend health check & dataset counts |
| `POST` | `/api/reset` | Reload default seed database |

---

## 🗄️ Storage Architecture
Data is persisted in JSON files located under [`backend/data/`](./data/):
- [`drivers.json`](./data/drivers.json)
- [`vehicles.json`](./data/vehicles.json)
- [`requests.json`](./data/requests.json)
- [`facilities.json`](./data/facilities.json)
- [`locations.json`](./data/locations.json)
