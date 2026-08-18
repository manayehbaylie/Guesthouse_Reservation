# Branch Merge Guide

How to merge the **`frontend`** and **`backend`** branches in the Guesthouse Reservation project, including the selective merge strategy used for **`correct-merg`**.

---

## 1. Branch overview

| Branch | Purpose | Typical contents |
|--------|---------|------------------|
| `frontend` | UI + client integration | React pages, `ApiService`, auth/booking flows, Vite proxy |
| `backend` | Server + database | Express API, Prisma schema/migrations/seed, server services |
| `correct-merg` | Combined branch | Backend base + frontend registration/payment modules |
| `main` | Stable integration | Previously merged snapshots |

Remote branches:

```
origin/frontend
origin/backend
origin/correct-merg
origin/main
```

---

## 2. Recommended merge strategy

This project does **not** merge cleanly with a single `git merge` because the `backend` branch updated the same client files that `frontend` changed (especially `api.js`, pages, and server auth/payment code).

**Use a selective merge:**

| Take from | What |
|-----------|------|
| **`backend` (base)** | Prisma schema, migrations, seed, guesthouse/admin/search server code, most UI pages (Home, Search, Navbar, Owner dashboard, etc.) |
| **`frontend`** | Registration & payment modules (see file list below) |

### Files from `frontend` (registration & payment)

**Client:**

```
client/src/pages/Auth/Register.jsx
client/src/pages/Guest/Booking.jsx
client/src/context/AuthContext.jsx
client/src/services/api.js
```

**Server:**

```
server/src/controllers/auth.controller.js
server/src/controllers/payment.controller.js
server/src/services/auth.service.js
server/src/services/payment.service.js
server/src/routes/auth.routes.js
server/src/routes/payment.routes.js
server/src/validators/auth.validator.js
server/src/validators/payment.validator.js
server/src/validators/reservation.validator.js
```

Everything else stays from **`backend`**.

---

## 3. Step-by-step: create `correct-merg`

### Prerequisites

```powershell
git fetch origin
```

Ensure you have latest `origin/frontend` and `origin/backend`.

---

### Step 1 — Create branch from `backend`

```powershell
cd "C:\Users\hp\Teamwork\Guest Reserve\Guesthouse_Reservation"

git checkout -B correct-merg origin/backend
```

This makes `correct-merg` start with all backend server updates, migrations, and client pages.

---

### Step 2 — Apply registration & payment from `frontend`

**PowerShell:**

```powershell
git checkout origin/frontend -- `
  client/src/pages/Auth/Register.jsx `
  client/src/pages/Guest/Booking.jsx `
  client/src/context/AuthContext.jsx `
  client/src/services/api.js `
  server/src/controllers/auth.controller.js `
  server/src/controllers/payment.controller.js `
  server/src/services/auth.service.js `
  server/src/services/payment.service.js `
  server/src/routes/auth.routes.js `
  server/src/routes/payment.routes.js `
  server/src/validators/auth.validator.js `
  server/src/validators/payment.validator.js `
  server/src/validators/reservation.validator.js
```

**Git Bash / Linux / macOS:**

```bash
git checkout origin/frontend -- \
  client/src/pages/Auth/Register.jsx \
  client/src/pages/Guest/Booking.jsx \
  client/src/context/AuthContext.jsx \
  client/src/services/api.js \
  server/src/controllers/auth.controller.js \
  server/src/controllers/payment.controller.js \
  server/src/services/auth.service.js \
  server/src/services/payment.service.js \
  server/src/routes/auth.routes.js \
  server/src/routes/payment.routes.js \
  server/src/validators/auth.validator.js \
  server/src/validators/payment.validator.js \
  server/src/validators/reservation.validator.js
```

---

### Step 3 — Review changes

```powershell
git status
git diff --stat HEAD
```

You should see about **13 files changed** (client + auth/payment server modules).

---

### Step 4 — Commit

```powershell
git commit -m "Rebuild correct-merg: backend base + frontend registration/payment" `
  -m "Base: origin/backend (schema, migrations, guesthouse, admin, search, UI pages)." `
  -m "From origin/frontend: Register, Booking, AuthContext, api.js, auth/payment server modules."
```

---

### Step 5 — Push to remote

**First time:**

```powershell
git push -u origin correct-merg
```

**Replace existing remote branch (rebuild):**

```powershell
git push origin --delete correct-merg
git push -u origin correct-merg --force
```

> Only force-push if your team agrees to replace the old `correct-merg` history.

---

## 4. Architecture after merge

```
correct-merg
├── backend base
│   ├── server/prisma/          (schema, migrations, seed)
│   ├── server/src/             (guesthouse, admin, search, …)
│   └── client/                 (Home, Search, Navbar, Owner pages, …)
│
└── frontend overlays
    ├── client/Register.jsx     (registration UI)
    ├── client/Booking.jsx      (payment / booking UI)
    ├── client/api.js           (backend-first + mock fallback)
    └── server/auth + payment   (registration & payment API)
```

---

## 5. Verify the merge

### Check registration/payment files match `frontend`

```powershell
git diff origin/frontend HEAD -- `
  client/src/pages/Auth/Register.jsx `
  client/src/pages/Guest/Booking.jsx `
  client/src/services/api.js
```

**Expected:** no output (files identical to `frontend`).

### Check backend-only files match `backend`

```powershell
git diff origin/backend HEAD -- `
  server/prisma/schema.prisma `
  client/src/pages/Guest/Home.jsx `
  client/src/components/Navbar.jsx
```

**Expected:** no output (files identical to `backend`).

### Run the app

```powershell
# Terminal 1 — backend
cd server
# Configure server/.env (see server/DATABASE-SETUP.md)
npx prisma migrate dev
npx prisma db seed
npm run dev

# Terminal 2 — frontend
cd client
copy .env.example .env
npm run dev
```

Open: http://localhost:5173

---

## 6. Alternative merge methods

### Option A — Full fast-forward (not recommended)

```powershell
git checkout -B correct-merg origin/frontend
git merge origin/backend
```

If `backend` is ahead of `frontend`, Git may **fast-forward** and overwrite frontend integration. This loses the selective merge benefit.

### Option B — Merge into `main`

After verifying `correct-merg`:

```powershell
git checkout main
git pull origin main
git merge correct-merg
git push origin main
```

Resolve any conflicts, then push.

### Option C — Pull request on GitHub

1. Push `correct-merg` to origin
2. Open: https://github.com/manayehbaylie/Guesthouse_Reservation/compare/main...correct-merg
3. Create PR, review diff, merge via GitHub UI

---

## 7. Merge conflicts explained (detailed)

This section documents **what conflicted** between the `frontend` and `backend` **branch names**, **why** Git could not auto-merge, and **how** the team fixed it for `correct-merg`.

> **Important:** `frontend` and `backend` here mean Git branches `origin/frontend` and `origin/backend` — not generic “frontend code” vs “backend code”.

---

### 7.1 Why conflicts happened

Both branches worked on the **same project** at the same time but with different goals:

| Branch | Main focus |
|--------|------------|
| `origin/frontend` | Connect UI to API, registration, booking/payment, `ApiService` integration |
| `origin/backend` | Database schema, migrations, seed, guesthouse/admin/search server updates |

The commit `fe10966` on **`backend`** ("Update guesthouse reservation system") changed many **same files** that **`frontend`** already changed. Git cannot pick a winner automatically → **merge conflict**.

Branch history (simplified):

```
* fe10966  backend — Update guesthouse reservation system
* fd07bcb  frontend — Resolve merge conflicts and fix syntax errors
|\
| * bfd5ed6  (shared history)
...
```

---

### 7.2 All conflicting files (30 total)

Run this to list them anytime:

```powershell
git diff --name-only origin/backend origin/frontend
```

#### Client conflicts (9 files)

| File | What differed |
|------|----------------|
| `client/src/services/api.js` | Frontend: backend-first + mock fallback. Backend: simpler axios client |
| `client/src/pages/Auth/Register.jsx` | Frontend: full registration UI. Backend: simplified version |
| `client/src/pages/Guest/Booking.jsx` | Frontend: full booking/payment flow. Backend: simpler version |
| `client/src/context/AuthContext.jsx` | Different auth/session handling |
| `client/src/components/Navbar.jsx` | Different navigation layout |
| `client/src/pages/Guest/Home.jsx` | Different home page |
| `client/src/pages/Guest/Search.jsx` | Different search page |
| `client/src/pages/Guest/GuesthouseDetail.jsx` | Different detail page |
| `client/src/pages/Owner/Dashboard.jsx` | Different owner dashboard |

#### Server conflicts (21 files)

| Area | Files |
|------|--------|
| **Database** | `server/prisma/schema.prisma`, `server/prisma/seed.js`, `server/prisma/migrations/20260818045609_add_staff_assignment/migration.sql` |
| **Auth** | `auth.controller.js`, `auth.service.js`, `auth.routes.js`, `auth.validator.js` |
| **Payment** | `payment.controller.js`, `payment.service.js`, `payment.routes.js`, `payment.validator.js` |
| **Guesthouse** | `guesthouse.controller.js`, `guesthouse.service.js`, `guesthouse.routes.js` |
| **Admin** | `admin.controller.js`, `admin.service.js`, `admin.routes.js` |
| **Search** | `search.controller.js`, `search.service.js`, `search.routes.js` |
| **Reservations** | `reservation.validator.js` |

---

### 7.3 Key conflict examples

#### Example 1 — `api.js`

| Branch | Version |
|--------|---------|
| **frontend** | Tries Express API first, falls back to mock `localStorage` data |
| **backend** | Basic axios instance, different structure |

**Resolution:** keep **`frontend`** version.

#### Example 2 — `Register.jsx` + `Booking.jsx`

| Branch | Version |
|--------|---------|
| **frontend** | Full registration and payment/booking UI |
| **backend** | Shorter/simpler pages |

**Resolution:** keep **`frontend`** version.

#### Example 3 — `schema.prisma` + `seed.js`

| Branch | Version |
|--------|---------|
| **backend** | New migration, staff assignment, updated seed users |
| **frontend** | Older schema/seed |

**Resolution:** keep **`backend`** version.

#### Example 4 — `payment.service.js`

| Branch | Version |
|--------|---------|
| **frontend** | `initiatePayment`, `getPaymentHistory`, Zod validation |
| **backend** | Simpler payment flow |

**Resolution:** keep **`frontend`** version.

---

### 7.4 What happens with a normal `git merge`

If you run:

```powershell
git merge origin/backend
```

Git may show conflict markers inside files:

```
<<<<<<< HEAD
... code from current branch ...
=======
... code from incoming branch ...
>>>>>>> origin/backend
```

You must edit each file, remove markers, choose the correct code, then:

```powershell
git add path/to/file
git commit
```

**Problem:** with **30 conflicting files**, manual marker resolution is slow and error-prone.

---

### 7.5 How we fixed it (selective merge — recommended)

Instead of resolving 30 conflict markers, we used a **selective merge**:

```
correct-merg = origin/backend (base) + registration/payment files from origin/frontend
```

| Step | Command / action |
|------|------------------|
| 1 | `git checkout -B correct-merg origin/backend` |
| 2 | `git checkout origin/frontend -- [13 files listed in Section 2]` |
| 3 | `git commit` |
| 4 | `git push origin correct-merg` |

**Result:** no `<<<<<<<` markers; each file explicitly chosen from the correct branch.

---

### 7.6 First merge attempt (mistake to avoid)

The first `correct-merg` used a simple fast-forward:

```
frontend → merge backend → fast-forward to fe10966
```

That **dropped frontend integration** because `backend` was ahead and overwrote frontend changes.

**Lesson:** do **not** rely on fast-forward alone. Use the selective merge in Section 3.

---

### 7.7 Conflict resolution rules (manual merge)

If you or a teammate merges manually and gets conflicts, use this table:

| File / area | Keep from branch | Reason |
|-------------|------------------|--------|
| `Register.jsx`, `Booking.jsx` | **frontend** | Registration & payment UI |
| `api.js` | **frontend** | Backend connection + mock fallback |
| `AuthContext.jsx` | **frontend** | Auth for register/login |
| `auth.*`, `payment.*` (server) | **frontend** | Registration & payment API |
| `reservation.validator.js` | **frontend** | Used by booking flow |
| `schema.prisma`, migrations, `seed.js` | **backend** | Database structure & data |
| `guesthouse.*`, `admin.*`, `search.*` | **backend** | Server business logic |
| `Home.jsx`, `Search.jsx`, `Navbar.jsx` | **backend** | Main UI pages |
| `Owner/Dashboard.jsx` | **backend** | Owner UI (unless team decides otherwise) |

#### Resolve one conflicted file

```powershell
# Keep frontend branch version
git checkout origin/frontend -- path/to/file

# Keep backend branch version
git checkout origin/backend -- path/to/file

git add path/to/file
git commit -m "Resolve merge conflict in path/to/file"
```

#### Resolve all registration/payment files at once

```powershell
git checkout origin/frontend -- `
  client/src/pages/Auth/Register.jsx `
  client/src/pages/Guest/Booking.jsx `
  client/src/context/AuthContext.jsx `
  client/src/services/api.js `
  server/src/controllers/auth.controller.js `
  server/src/controllers/payment.controller.js `
  server/src/services/auth.service.js `
  server/src/services/payment.service.js `
  server/src/routes/auth.routes.js `
  server/src/routes/payment.routes.js `
  server/src/validators/auth.validator.js `
  server/src/validators/payment.validator.js `
  server/src/validators/reservation.validator.js
```

---

### 7.8 Verify conflicts are resolved

```powershell
# Registration/payment files must match frontend branch
git diff origin/frontend HEAD -- client/src/services/api.js
# Expected: no output

# Backend-only files must match backend branch
git diff origin/backend HEAD -- server/prisma/schema.prisma
# Expected: no output
```

---

### 7.9 Merge conflict vs database error (do not confuse)

| Error | Type | Fix |
|-------|------|-----|
| Git `<<<<<<<` markers, "CONFLICT" on merge | **Code merge conflict** | This guide (Section 7) |
| `P1000 Authentication failed` (Prisma) | **Database config** | `server/DATABASE-SETUP.md` |
| `401 Unauthorized` on API | **Auth / JWT** | Login with valid user; check `server/.env` |

---

## 8. Teammate workflow

### Clone and use merged branch

```powershell
git clone https://github.com/manayehbaylie/Guesthouse_Reservation.git
cd Guesthouse_Reservation
git fetch origin
git checkout correct-merg
```

### Stay updated

```powershell
git pull origin correct-merg
```

### Contribute back

```powershell
git checkout -b feature/my-change
# ... make changes ...
git push -u origin feature/my-change
# Open PR into correct-merg or main
```

---

## 9. Related documentation

| Document | Description |
|----------|-------------|
| [MERGE-GUIDE.md](./MERGE-GUIDE.md) | This file — how to merge `frontend` + `backend` |
| [../server/DATABASE-SETUP.md](../server/DATABASE-SETUP.md) | Fix PostgreSQL connection (P1000 errors) |
| [../server/.env.example](../server/.env.example) | Backend environment template |
| [../client/.env.example](../client/.env.example) | Frontend environment template |

---

## 10. Quick command reference

```powershell
# Full rebuild of correct-merg (copy-paste)
git fetch origin
git checkout -B correct-merg origin/backend

git checkout origin/frontend -- `
  client/src/pages/Auth/Register.jsx `
  client/src/pages/Guest/Booking.jsx `
  client/src/context/AuthContext.jsx `
  client/src/services/api.js `
  server/src/controllers/auth.controller.js `
  server/src/controllers/payment.controller.js `
  server/src/services/auth.service.js `
  server/src/services/payment.service.js `
  server/src/routes/auth.routes.js `
  server/src/routes/payment.routes.js `
  server/src/validators/auth.validator.js `
  server/src/validators/payment.validator.js `
  server/src/validators/reservation.validator.js

git commit -m "Rebuild correct-merg: backend base + frontend registration/payment"
git push -u origin correct-merg --force
```

---

## 11. Summary

| Question | Answer |
|----------|--------|
| Which branch is the merge result? | `correct-merg` |
| What is the base? | `origin/backend` |
| What comes from frontend? | Registration & payment modules (13 files) |
| Why not a simple merge? | **30 files** conflicted; selective checkout avoids losing integration |
| How many files conflicted? | **30** (9 client + 21 server) |
| How were conflicts fixed? | Selective merge — backend base + frontend registration/payment |
| Where is conflict detail documented? | **Section 7** of this file |
| Where is connection setup documented? | `client/.env.example`, Vite proxy in `client/vite.config.js`, `ApiService` in `client/src/services/api.js` |
| Database not connecting after merge? | `server/DATABASE-SETUP.md` |
