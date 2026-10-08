# Telegram bot setup

1. Create a bot with Telegram's BotFather and put its token in `server/.env` as `TELEGRAM_BOT_TOKEN`. Set its username as `TELEGRAM_BOT_USERNAME`. Never put the token in the React app or commit it.
2. Apply the Prisma migration with `npx prisma migrate deploy` from `server`.
3. Start the server normally. When the token is configured, the server starts Telegram long polling; otherwise the bot remains disabled.
4. While signed in to the website, open Profile → Telegram chatbot → Connect Telegram, then follow the generated link. Pairing codes are one-time, expire after 10 minutes, and are stored hashed in the existing database. `/unlink` or Profile → Disconnect disconnects the account.

The bot reuses the platform's login, AI, search, reservation, and guest payment-history APIs. Linked account IDs are stored on the existing `User` table. Reservation access follows the account role: guests see their own reservations, owners see their properties' reservations, receptionists see reservations for assigned properties, and admins see all. Search is public and limited to approved guesthouses and available rooms; location matching searches city, address, sub-city, woreda, and guesthouse name without a hard-coded city list. Use `/search <location> [room type] [under price] [check-in check-out]`; dates must use `YYYY-MM-DD`.

Reservation and payment notifications saved by the existing application are also sent to linked Telegram accounts. All bot interactions are restricted to private chats.
