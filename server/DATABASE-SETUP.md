# PostgreSQL Setup — Fix P1000 Authentication Error

Error you see:

```
Authentication failed against database server, the provided database credentials for `postgres` are not valid.
```

**Cause:** Password in `server/.env` does not match your local PostgreSQL `postgres` user.

**Current project default:** password `1221`, database `Guesthouse_db`.

---

## FASTEST FIX (Windows — one click)

1. Open File Explorer → go to `server/scripts/`
2. **Double-click** `setup-postgres-admin.bat`
3. Click **Yes** on the Administrator prompt
4. Wait for **SUCCESS! PostgreSQL is ready.**
5. Then run:

```powershell
cd server
npx prisma migrate dev
npx prisma db seed
npm run dev
```

This script:
- Temporarily allows local trust login
- Sets postgres password to `1221` (matches `.env`)
- Creates database `Guesthouse_db`
- Restores secure authentication

---

## Manual fix (pgAdmin)

1. Open **pgAdmin 4**
2. Connect with your **PostgreSQL install password** (use `1221` if you set it as above)
3. **Query Tool** → run:

```sql
ALTER USER postgres WITH PASSWORD '1221';

CREATE DATABASE "Guesthouse_db";
```

4. Ensure `server/.env` contains:

```env
DATABASE_URL="postgresql://postgres:1221@localhost:5432/Guesthouse_db?schema=public"
JWT_SECRET="guesthouse_secret_key"
PORT=5000
```

5. Test and migrate:

```powershell
cd server
node scripts/test-db-connection.mjs
npx prisma migrate dev
npx prisma db seed
```

---

## Verify connection

```powershell
cd server
node scripts/test-db-connection.mjs
```

Expected:

```
✅ Database connection successful!
```

---

## After seed — login credentials

| Email | Password |
|-------|----------|
| `admin@gmail.com` | `password123` |

(See `prisma/seed.js` for full list.)

---

## Still failing?

| Problem | Solution |
|---------|----------|
| `setup-postgres-admin.bat` access denied | Right-click → **Run as administrator** |
| pgAdmin won't connect | Use install password or reset via `setup-postgres-admin.bat` |
| Port 5432 in use | Stop other PostgreSQL instances |
| Password has `@` or `#` | URL-encode in `DATABASE_URL` (`@` → `%40`) |

---

## Important

- **This is not a code bug** — PostgreSQL must accept the password in `.env`
- Never commit `server/.env` to Git (it is gitignored)
- Teammates each run the same setup on their own machine
