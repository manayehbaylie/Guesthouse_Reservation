# Guesthouse Not Showing Publicly After Admin Approval

This document explains why approved guesthouses sometimes did not appear on the public Home/Search pages, and how the issue was fixed.

---

## Expected Behavior

After an owner registers a guesthouse and an admin approves it, the property should appear on:

- Home page (`/`)
- Search page (`/search`)
- Guesthouse detail page (`/guesthouse/:id`)

---

## How Public Listing Works

The public API only returns guesthouses with status **`APPROVED`**.

**Backend:** `server/src/services/guesthouse.service.js`

```javascript
export const getAllGuesthouses = async () => {
  return await prisma.guesthouse.findMany({
    where: {
      status: "APPROVED",
    },
    // ...
  });
};
```

**Frontend:** pages call `ApiService.getGuesthouses()`, which requests `GET /api/guesthouses`.

So the rule is simple:

| Status    | Visible to public? |
|-----------|--------------------|
| `DRAFT`   | No                 |
| `PENDING` | No                 |
| `APPROVED`| **Yes**            |
| `REJECTED`| No                 |

If a guesthouse is not public, either it was never set to `APPROVED`, or the frontend is not reading from the real backend.

---

## Root Causes (What Was Wrong)

### 1. New guesthouses were saved as `DRAFT` instead of `PENDING`

When an owner registered a guesthouse from the Owner Dashboard, the backend created it with:

```
status: "DRAFT"
```

But the admin **Pending Approvals** list only loaded guesthouses with:

```
status: "PENDING"
```

**Result:** Many new guesthouses were invisible to the admin. They could not approve what they could not see, so nothing became public.

---

### 2. Admin dashboard used the public API for “All Guesthouses”

The admin panel loaded guesthouses using the same endpoint as the public site:

```
GET /api/guesthouses
```

That endpoint only returns **`APPROVED`** guesthouses.

**Result:** Pending and draft properties did not appear in the admin “All Guesthouses” section, which made verification and debugging confusing.

---

### 3. Database migration was not applied (Prisma out of sync)

The code expected new `User` fields:

- `residentialAddress`
- `idType`
- `idNumber`

If migrations were not applied and Prisma client was not regenerated, API calls failed with errors like:

```
Unknown argument `residentialAddress`
Unknown field `residentialAddress` for select statement on model `User`
```

When the public guesthouse API failed, the frontend could **fall back to mock data** (old seed guesthouses only).

**Result:** Even after a successful approval in the database, the UI might still show only mock properties — not the newly approved guesthouse.

---

## Correct Workflow (After Fix)

```
1. Owner registers account        →  role: OWNER
2. Owner registers guesthouse     →  status: PENDING
3. Admin sees it in Pending list  →  clicks Approve
4. Status becomes APPROVED        →  appears on public Home/Search
```

### Owner registration (account only)

- Route: `POST /api/auth/register`
- Role: `OWNER`
- Requires: `fullName`, `email`, `password`, `phone`, `residentialAddress`, `idType`, `idNumber`
- Owner can log in immediately; guesthouse is a separate step.

### Guesthouse registration (from Owner Dashboard)

- Route: `POST /api/owner/guesthouse`
- Creates guesthouse with status **`PENDING`**
- Admin must approve before it goes live.

### Admin approval

- Pending list: `GET /api/guesthouses/pending` (includes `DRAFT` and `PENDING`)
- Approve: `PUT /api/admin/guesthouses/:id/approve`
- Sets status to **`APPROVED`**

### Public listing

- Route: `GET /api/guesthouses`
- Returns only **`APPROVED`** guesthouses

---

## Fixes Applied

| Area | File(s) | Change |
|------|---------|--------|
| Owner guesthouse creation | `server/src/services/owner.service.js` | New guesthouses start as **`PENDING`**, not `DRAFT` |
| Admin pending list | `server/src/services/guesthouse.service.js` | Pending query includes **`DRAFT` + `PENDING`** |
| Admin full list | `server/src/services/admin.service.js`, `server/src/routes/admin.routes.js` | Added **`GET /api/admin/guesthouses`** (all statuses) |
| Admin UI | `client/src/pages/Admin/Dashboard.jsx` | Uses admin guesthouse list; Approve works for `draft` and `pending` |
| Frontend API | `client/src/services/api.js` | Added `getAdminGuesthouses()` |
| Database | Prisma migrations | Applied owner/guesthouse workflow migration; regenerated Prisma client |

---

## Setup Required (Teammates)

If owner registration or public listing fails, run:

```powershell
cd server
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Restart the backend after `prisma generate` (stop Node/nodemon first if you get an `EPERM` error on Windows).

---

## Troubleshooting Checklist

### Guesthouse still not public after admin approval

1. **Confirm backend is running** on port `5000`
2. **Confirm frontend is running** on http://localhost:5175 (Vite proxy to backend)
3. **Check database status** — guesthouse row must be `APPROVED`:

   ```sql
   SELECT id, name, status FROM "Guesthouse" ORDER BY id DESC;
   ```

4. **Force API mode in browser** (DevTools → Console):

   ```javascript
   localStorage.setItem('gh_backend_mode', 'api');
   localStorage.removeItem('gh_api_url');
   location.reload();
   ```

5. **Test API directly:**

   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/guesthouses" -Method GET
   ```

   The approved guesthouse should appear in the response.

### Owner registration error (`residentialAddress`)

- Run migrations and regenerate Prisma client (see Setup above).
- Restart the backend server.

### Admin does not see guesthouse in Pending

- Check status in DB: should be `PENDING` or `DRAFT`.
- If stuck in `DRAFT`, admin can still approve from Pending (after fix) or update status manually for testing:

   ```sql
   UPDATE "Guesthouse" SET status = 'PENDING' WHERE id = <id>;
   ```

---

## Seed Accounts (for testing)

**Password for all seed users:** `password123`

| Role         | Email               |
|--------------|---------------------|
| Admin        | `admin@gmail.com`   |
| Owner        | `manayeh@gmail.com` |
| Receptionist | `marta@gmail.com`   |
| Guest        | `senayt@gmail.com`  |

---

## Summary

Guesthouses were not public after “verification” because:

1. Properties were often stuck in **`DRAFT`**, not in the admin pending queue.
2. The admin UI used the **public API**, which hides non-approved guesthouses.
3. **Missing DB migrations** caused API failures and mock-data fallback on the frontend.

After the fixes, the flow is: **Owner submits → Admin approves → Status `APPROVED` → Public listing shows the guesthouse.**
