# Frontend–Backend Connection Guide

Technical documentation for connecting the **Guesthouse Reservation** React frontend to the **Express + Prisma** backend in this repository.

---

## 1. Project Overview

| Layer | Path | Stack | Default URL |
|-------|------|-------|-------------|
| Frontend | `client/` | React 18, Vite 6, Axios | `http://localhost:5173` |
| Backend | `server/` | Express 5, Prisma 6, PostgreSQL | `http://localhost:5000` |
| Database | PostgreSQL | Prisma ORM | `localhost:5432` |

All UI pages and components talk to data through a **single service layer**:

```
Pages / Components
       │
       ▼
  ApiService  (client/src/services/api.js)
       │
       ├──► Express API  (/api/*)     ← backend-first
       │
       └──► Mock storage (localStorage) ← fallback
```

**No page or component files need to be changed** to switch between backend and mock data. Integration is centralized in `client/src/services/api.js`.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser  http://localhost:5173                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React App (client/src)                               │  │
│  │    AuthContext, Dashboard, Search, Admin, Owner...  │  │
│  │              │                                        │  │
│  │              ▼                                        │  │
│  │         ApiService (api.js)                           │  │
│  │    ┌─────────┴─────────┐                              │  │
│  │    │  mode = "api"     │  mode = "mock"               │  │
│  │    ▼                   ▼                              │  │
│  │  axios (/api)     localStorage + mockData.js          │  │
│  └───────┬───────────────────────────────────────────────┘  │
└──────────┼──────────────────────────────────────────────────┘
           │  GET /api/guesthouses
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Vite Dev Proxy (client/vite.config.js)                     │
│  /api/*  ──►  http://localhost:5000/api/*                 │
└──────────┬──────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express Server (server/src)                                │
│    app.js  →  routes  →  controllers  →  services           │
│                              │                              │
│                              ▼                              │
│                         Prisma Client                       │
│                              │                              │
│                              ▼                              │
│                         PostgreSQL                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Prerequisites

Install on each developer machine:

- **Node.js** 18+ (recommended 20+)
- **npm**
- **PostgreSQL** 14+ (running locally)
- **Git**

Optional:

- **pgAdmin** or **DBeaver** for database management
- Browser dev tools for network inspection

---

## 4. First-Time Setup

### 4.1 Clone and install dependencies

```powershell
git clone <repository-url>
cd Guesthouse_Reservation

cd server
npm install

cd ../client
npm install
```

### 4.2 Backend environment (`server/.env`)

Copy the example file and edit it:

```powershell
cd server
copy .env.example .env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/guesthouse_reservation?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=5000
```

> **Important:** Replace `YOUR_PASSWORD` with your local PostgreSQL `postgres` user password.  
> This file is **gitignored** — each developer maintains their own copy.

### 4.3 Frontend environment (`client/.env`)

```powershell
cd client
copy .env.example .env
```

Default `client/.env`:

```env
VITE_API_BASE_URL=/api
VITE_DEFAULT_BACKEND_MODE=api
VITE_API_FALLBACK=true
VITE_DEFAULT_PASSWORD=Password123
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Base path for all API requests (use `/api` in dev with Vite proxy) |
| `VITE_DEFAULT_BACKEND_MODE` | `api` = try backend first; `mock` = localStorage only |
| `VITE_API_FALLBACK` | `true` = use mock data when backend fails |
| `VITE_DEFAULT_PASSWORD` | Password sent to backend when UI login has no password field |

### 4.4 Database setup

Create the database (if it does not exist), run migrations, and seed demo data:

```powershell
cd server
npx prisma migrate dev
npx prisma db seed
```

### 4.5 Start both servers

**Terminal 1 — Backend:**

```powershell
cd server
npm run dev
```

Expected output:

```
Server running on port 5000
```

**Terminal 2 — Frontend:**

```powershell
cd client
npm run dev
```

Open: **http://localhost:5173**

---

## 5. How the Connection Works

### 5.1 Vite proxy (development)

File: `client/vite.config.js`

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
},
```

This means:

- Frontend calls `GET /api/guesthouses`
- Browser sends request to `http://localhost:5173/api/guesthouses`
- Vite forwards it to `http://localhost:5000/api/guesthouses`
- No CORS issues in development

### 5.2 Axios client

File: `client/src/services/api.js`

```js
export const api = axios.create({
  baseURL: '/api',  // from VITE_API_BASE_URL
  headers: { 'Content-Type': 'application/json' },
});
```

A request interceptor attaches the JWT automatically:

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 5.3 Backend-first with mock fallback

Every `ApiService` method follows this pattern:

1. If mode is **`mock`** → use `localStorage` (seeded from `mockData.js`)
2. If mode is **`api`** → call Express backend
3. On failure (500, network error) → fall back to mock (if `VITE_API_FALLBACK=true`)
4. After a server/DB failure, a **circuit breaker** stops further backend calls for the session to avoid repeated errors

Console message when fallback activates:

```
[ApiService] Backend unavailable (...). Using mock data for this session.
```

### 5.4 Backend response format

Express controllers return:

```json
{
  "success": true,
  "message": "Guesthouses fetched successfully",
  "data": [ ... ]
}
```

`ApiService` unwraps this via:

```js
function unwrap(response) {
  return response?.data?.data ?? response?.data;
}
```

Health check (no wrapper):

```json
{ "status": "ok", "timestamp": "..." }
```

---

## 6. Execution Modes

### Mode A — Full backend (recommended for integration testing)

```env
VITE_DEFAULT_BACKEND_MODE=api
VITE_API_FALLBACK=true
```

Requires: PostgreSQL running, valid `server/.env`, migrations + seed completed.

### Mode B — Mock only (UI demo, no database)

Set in browser console or `client/.env`:

```env
VITE_DEFAULT_BACKEND_MODE=mock
```

Or at runtime:

```js
ApiService.setBackendMode('mock');
location.reload();
```

### Mode C — Switch at runtime

```js
// Use live backend
ApiService.setBackendMode('api', '/api');

// Force mock storage
ApiService.setBackendMode('mock');

// Check current settings
ApiService.getBackendMode();  // "api" | "mock"
ApiService.getApiUrl();        // "/api"
```

Settings are stored in `localStorage` under:

- `gh_backend_mode`
- `gh_api_url`

---

## 7. Authentication Flow

### Backend login

| Step | Action |
|------|--------|
| 1 | UI calls `ApiService.loginUser(email)` |
| 2 | Service sends `POST /api/auth/login` with `{ email, password }` |
| 3 | Backend returns `{ user, token }` |
| 4 | Token saved to `localStorage` key `token` |
| 5 | User saved to `localStorage` key `gh_current_user_v2` |

Default password when UI does not collect one: **`Password123`** (matches seed data).

### Backend register

UI sends `{ name, email, phone, role }`. Service maps to backend format:

```json
{
  "fullName": "Abebe Bikila",
  "email": "guest@example.com",
  "phone": "+251911111111",
  "password": "Password123",
  "role": "GUEST"
}
```

### Seeded test accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `Password123` | ADMIN |
| `owner1@example.com` | `Password123` | OWNER |
| `owner2@example.com` | `Password123` | OWNER |

### Protected routes

Backend routes require `Authorization: Bearer <token>` and role checks.

Example: `GET /api/admin/users` requires **ADMIN** role and a valid JWT.

---

## 8. API Endpoint Mapping

Frontend methods in `ApiService` map to Express routes as follows:

| ApiService method | HTTP | Backend route | Auth required |
|-------------------|------|---------------|---------------|
| `loginUser` | POST | `/api/auth/login` | No |
| `registerUser` | POST | `/api/auth/register` | No |
| `getGuesthouses` | GET | `/api/guesthouses` + `/api/rooms` | No |
| `getGuesthouseById` | GET | `/api/guesthouses/:id` + `/api/rooms` | No |
| `registerGuesthouse` | POST | `/api/guesthouses` | OWNER |
| `getRoomsForGuesthouse` | GET | `/api/rooms` (filtered client-side) | No |
| `addRoom` | POST | `/api/rooms/:guesthouseId` | OWNER |
| `updateRoomAvailability` | PUT | `/api/rooms/:id` | OWNER |
| `createBookingAndPay` | POST | `/api/reservations` then `/api/payments` | GUEST |
| `getReservations` | GET | `/api/guest/reservations` or role-based | Yes |
| `performCheckIn` | PATCH | `/api/receptionist/reservations/:id/check-in` | RECEPTIONIST |
| `performCheckOut` | PATCH | `/api/receptionist/reservations/:id/check-out` | RECEPTIONIST |
| `getReceptionistArrivals` | GET | `/api/receptionist/today-arrivals` | RECEPTIONIST |
| `getReceptionistDepartures` | GET | `/api/receptionist/today-departures` | RECEPTIONIST |
| `getOwnerPayments` | GET | `/api/dashboard/owner/recent-payments` | OWNER |
| `getOwnerRevenueReport` | GET | `/api/dashboard/owner/revenue` | OWNER |
| `getAdminPlatformStats` | GET | `/api/dashboard` | ADMIN |
| `getAdminPendingGuesthouses` | GET | `/api/guesthouses/pending` | ADMIN |
| `approveGuesthouse` | PUT | `/api/admin/guesthouses/:id/approve` | ADMIN |
| `fetchAdminUsers` | GET | `/api/admin/users` | ADMIN |

> `getAllUsers()` always returns mock users synchronously (used by the Navbar role-switch demo).  
> Admin pages use `fetchAdminUsers()` for live backend data.

Full API documentation (Swagger): **http://localhost:5000/api-docs**

---

## 9. Data Shape Mapping

The frontend was originally built for mock data. `api.js` translates backend models to the UI format.

### Users

| Backend (Prisma) | Frontend (UI) |
|------------------|---------------|
| `fullName` | `name` |
| `role: "GUEST"` | `role: "Guest"` |
| `id: 1` (number) | `id: 1` (used as string in places) |

### Guesthouses

| Backend | Frontend |
|---------|----------|
| `status: "APPROVED"` | `status: "approved"` |
| `address` | `location` |
| `image` (single) | `images: [image]` |

### Rooms

| Backend | Frontend |
|---------|----------|
| `roomType: "DOUBLE"` | `type: "DOUBLE"` |
| `price` | `pricePerNight` |
| `available: true` | `availabilityStatus: "available"` |

### Reservations

| Backend | Frontend |
|---------|----------|
| `checkIn` (DateTime) | `checkInDate` (`YYYY-MM-DD`) |
| `status: "CHECKED_IN"` | `status: "checked_in"` |

### Roles

| Backend enum | Frontend string |
|--------------|-----------------|
| `GUEST` | `Guest` |
| `OWNER` | `Owner` |
| `RECEPTIONIST` | `Receptionist` |
| `ADMIN` | `Admin` |

---

## 10. Key Files Reference

| File | Responsibility |
|------|----------------|
| `client/src/services/api.js` | **Main integration layer** — axios, mock, backend dispatch, mappers |
| `client/src/data/mockData.js` | Seed data for mock / fallback mode |
| `client/vite.config.js` | Dev proxy `/api` → port 5000 |
| `client/.env` | Frontend connection settings |
| `client/.env.example` | Template for teammates |
| `server/src/app.js` | Express app, CORS, route mounting |
| `server/src/server.js` | Server entry, loads `.env`, binds port |
| `server/.env` | Database URL, JWT secret, port |
| `server/.env.example` | Template for teammates |
| `server/prisma/schema.prisma` | Database models |
| `server/prisma/seed.js` | Demo users and sample data |

---

## 11. Verification Checklist

Run these checks after setup:

### Backend health

```powershell
curl.exe http://localhost:5000/api/health
```

Expected:

```json
{"status":"ok","timestamp":"..."}
```

### Database connection

```powershell
curl.exe http://localhost:5000/api/guesthouses
```

Expected (success):

```json
{"success":true,"message":"Guesthouses fetched successfully","data":[...]}
```

Expected (DB not configured):

```json
{"success":false,"message":"Database connection failed. Check DATABASE_URL..."}
```

### Frontend proxy

With both servers running, open browser DevTools → Network → filter `guesthouses`.  
Request URL should be `http://localhost:5173/api/guesthouses` and return data or fallback to mock.

### Auth test

1. Open http://localhost:5173
2. Log in with `admin@example.com` (backend uses password `Password123` automatically)
3. Check DevTools → Application → Local Storage → `token` should contain a real JWT (not `jwt_token_...`)

---

## 12. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `500` / `503` on `/api/*` | Wrong PostgreSQL password or DB not running | Fix `DATABASE_URL` in `server/.env`, ensure PostgreSQL is running, run `npx prisma migrate dev` |
| App shows mock data only | Backend failed; circuit breaker opened | Fix backend, refresh page, or run `ApiService.setBackendMode('api')` |
| `401 Unauthorized` | Missing or invalid JWT | Log in again; ensure token is stored in `localStorage` |
| `401` on `/api/admin/users` | Called without admin token | Use admin login; admin pages use `fetchAdminUsers()` |
| CORS errors | Calling `localhost:5000` directly from browser | Use `/api` path (Vite proxy), not full backend URL in dev |
| Empty guesthouse list | No approved guesthouses in DB | Run `npx prisma db seed` |
| Port 5000 in use | Another process on port 5000 | Change `PORT` in `server/.env` and update Vite proxy target |
| `.env` not loaded on server | Missing dotenv | Already handled in `server/src/server.js` via `import "dotenv/config"` |

---

## 13. Production Notes

For production deployment:

1. Set `VITE_API_BASE_URL` to the deployed API URL (e.g. `https://api.yourdomain.com/api`)
2. Remove or disable Vite proxy (proxy is dev-only)
3. Configure CORS on Express for the frontend origin
4. Use strong `JWT_SECRET` and production `DATABASE_URL`
5. Set `VITE_API_FALLBACK=false` if mock data must never appear in production

Example production `client/.env`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_DEFAULT_BACKEND_MODE=api
VITE_API_FALLBACK=false
```

---

## 14. Quick Reference Commands

```powershell
# Backend
cd server
copy .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend
cd client
copy .env.example .env
npm install
npm run dev

# Prisma Studio (optional DB browser)
cd server
npx prisma studio
```

---

## 15. Summary

| Question | Answer |
|----------|--------|
| Where is frontend connected to backend? | `client/src/services/api.js` |
| How do requests reach Express in dev? | Vite proxy: `/api` → `http://localhost:5000` |
| What if backend is down? | Mock fallback from `localStorage` / `mockData.js` |
| Do pages need changes to use backend? | No — all use `ApiService` |
| What must each developer configure locally? | `server/.env` (DB password) and `client/.env` (copy from example) |

For API details beyond this guide, use Swagger at **http://localhost:5000/api-docs** while the backend is running.
