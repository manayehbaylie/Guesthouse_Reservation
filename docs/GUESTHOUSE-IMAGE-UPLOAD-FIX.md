# Guesthouse Image Upload Fix

This document explains why guesthouse images were saved as `null` in the database (and not shown on public pages after admin approval), and what was fixed.

---

## Expected Behavior

1. Owner registers a guesthouse and uploads a **main image** (file or URL).
2. Image path is saved in the database `Guesthouse.image` column.
3. Admin approves the guesthouse.
4. Public Home/Search pages display the saved image.

---

## The Problem

After owner registration and admin approval, the `image` column in PostgreSQL was **`null`**, and public pages showed no photo.

This happened because of **three separate bugs** working together.

---

## Root Cause 1 — Wrong form field name

The backend multer upload expects the main image field to be named:

```
image
```

But the frontend sometimes sent files under:

```
images   ❌ (plural — ignored by backend)
```

**Result:** The file never reached multer, so nothing was uploaded and `image` stayed `null`.

---

## Root Cause 2 — URL strings were not sent to the backend

The helper `guesthouseFormData()` only appended images when they were **`File` objects**.

It **ignored string values**, including:

- External URLs (e.g. Unsplash links from Owner Dashboard onboarding)
- Existing saved paths like `/uploads/guesthouses/abc.jpg` when re-submitting without re-uploading

**Owner Dashboard example (before fix):**

```javascript
await ApiService.registerGuesthouse({
  images: [onboardingImage],  // URL string in wrong field
});
```

Neither the field name nor the type was handled correctly → **`image: null` in database**.

---

## Root Cause 3 — Uploaded files not visible on frontend (display issue)

Even when images were saved correctly as `/uploads/guesthouses/filename.jpg`, the browser loaded them from:

```
http://localhost:5175/uploads/...
```

But files are stored on the **backend** at:

```
http://localhost:5000/uploads/...
```

Vite only proxied `/api`, not `/uploads`.

**Result:** Database had a path, but the UI showed a broken image on public pages.

---

## How Image Storage Works

| Step | What happens |
|------|----------------|
| Owner selects file | Frontend sends `multipart/form-data` with field `image` |
| Multer (backend) | Saves file to `server/uploads/guesthouses/` |
| Controller | Sets `data.image = "/uploads/guesthouses/filename.jpg"` |
| Database | Stores path in `Guesthouse.image` |
| Public API | Returns `image` with approved guesthouses |
| Frontend | Loads `/uploads/guesthouses/filename.jpg` (proxied to backend) |

**Supported image sources:**

- Uploaded file (`.jpg`, `.jpeg`, `.png`, `.webp`) — stored on server
- External URL string — stored directly in `image` column

---

## Fixes Applied

### 1. `client/src/services/api.js` — `guesthouseFormData()`

- Sends main image as field **`image`** (correct multer name)
- Sends **`File`** uploads and **string URLs**
- First file/URL from `images[]` becomes main `image`; extras go to `photos`
- Preserves existing image path strings on resubmit

### 2. `client/src/pages/Owner/GuesthouseManage.jsx`

- Re-sends existing image path when owner submits for review without re-uploading

### 3. `client/src/pages/Owner/Dashboard.jsx`

- Onboarding and property update now send `image: urlString` instead of `images: [url]`

### 4. `client/vite.config.js`

- Added proxy for **`/uploads`** → `http://localhost:5000`

### 5. `server/src/controllers/owner.controller.js`

- Handles single string value in `photos` form field

---

## Correct Owner Flow (After Fix)

### Option A — Guesthouse Manage page (recommended)

1. Go to **Owner → Guesthouse Manage**
2. Upload **main image** (file input)
3. Upload license document
4. Click **Submit for Administrator Review**
5. Admin approves
6. Image appears on public pages

### Option B — Owner Dashboard onboarding

1. Enter guesthouse details
2. Provide image URL or upload (URL is now saved to `image` column)
3. Admin approves
4. Image appears publicly

---

## Verify the Fix

### Check database

```sql
SELECT id, name, status, image, photos FROM "Guesthouse" ORDER BY id DESC;
```

After owner upload, `image` should **not** be null. Example:

```
/uploads/guesthouses/1724839200000-uuid.jpg
```

or an external URL:

```
https://images.unsplash.com/photo-...
```

### Check API

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/guesthouses" -Method GET
```

Approved guesthouses should include a non-null `image` field.

### Check file on disk

Uploaded files should exist in:

```
server/uploads/guesthouses/
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `image` is null in DB | File not sent as field `image` | Use Guesthouse Manage upload; restart frontend after code update |
| Path in DB but broken image in browser | `/uploads` not proxied | Restart Vite dev server after `vite.config.js` update |
| Image lost after submit | Existing path not resent | Fixed in `GuesthouseManage.jsx` — pull latest code |
| Only seed guesthouses have images | Frontend using mock mode | Run `localStorage.setItem('gh_backend_mode', 'api')` and reload |

---

## Important Notes

- **`image`** = main cover photo (shown on public cards)
- **`photos`** = additional gallery images (optional)
- Admin approval only changes **`status`** to `APPROVED`; it does **not** remove images
- Maximum upload size: **5 MB** per file
- Allowed types: **JPG, JPEG, PNG, WEBP, PDF** (for license document)

---

## Summary

Images were null because the frontend **did not send them correctly** to the backend (wrong field name + URL strings ignored). Even when saved, images could **fail to display** because `/uploads` was not proxied to the backend server. All three issues are now fixed.
