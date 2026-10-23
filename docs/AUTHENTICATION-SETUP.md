# Authentication Setup

## Stack

Authentication uses the existing React/Vite client, Express API, Prisma ORM, and PostgreSQL database. Access tokens are 15 minutes; refresh tokens are opaque, stored hashed in PostgreSQL, and issued in an HTTP-only cookie. Password reset codes are stored as HMAC hashes.

## Configure and Run

1. Install the existing client and server dependencies, then create the local environment file:

   ```powershell
   cd server
   npm install
   Copy-Item .env.example .env
   cd ../client
   npm install
   ```

2. In `server/.env`, set `DATABASE_URL` and replace `JWT_SECRET`, `RESET_TOKEN_SECRET`, and `RESET_CODE_SECRET` with independent values. Generate each secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Keep the configured frontend origin at `http://localhost:5175` for local development.
3. Apply the migration and generate Prisma Client:

   ```powershell
   cd server
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Start the API and client in separate terminals:

   ```powershell
   cd server
   npm run dev
   ```

   ```powershell
   cd client
   npm run dev -- --host 0.0.0.0 --port 5175
   ```

5. Configure password recovery delivery in `server/.env`: set `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM` sender for email, and/or `AT_USERNAME` plus `AT_API_KEY` (optionally `AT_SENDER_ID`) for Africa's Talking SMS. Configured providers are used in both development and production. Without provider credentials, the request fails visibly instead of pretending that a code was delivered.

## Flow Checks

- Guest without email: register as Guest with a valid Ethiopian phone and password. The account is active immediately and opens `/guest/dashboard`. Login later with the phone and password.
- Guest with email: repeat with a valid Gmail address. Confirm the email is optional, then test both phone and email login.
- Owner: select Owner, confirm the email changes to required, provide the existing required residential address and ID fields, and register. The account is active and opens `/owner`.
- Login: test the Email and Phone tabs. Unknown identifiers return `This account is not registered.`; a wrong password returns `Incorrect password.`. Five failed account/IP attempts in 15 minutes trigger the retry message.
- Reset by email: request a code using the account Gmail address, retrieve it from the inbox, paste/type all six digits, verify, then submit a new password.
- Reset by SMS: select Phone and use the account phone number, retrieve the code on that handset, then complete the same OTP and new-password steps.
- Session: after login, reload a protected page. The client refreshes the access token with its HTTP-only cookie. Logout revokes the refresh token and the current access session.

The reset-request endpoint always returns `If the account exists, a code has been sent.` for validly shaped requests. New account registration does not send or request verification codes.

## Provider Notes

The implementation uses Resend's HTTP API and Africa's Talking SMS. Provider credentials and an approved sender/domain are required for production delivery. Localhost development cookies are HTTP-only and SameSite=Lax; production cookies are Secure and SameSite=None, so production must use HTTPS.
