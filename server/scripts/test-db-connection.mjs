import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("❌ DATABASE_URL is missing in server/.env");
  process.exit(1);
}

const safeUrl = url.replace(/:([^:@/]+)@/, ":****@");
console.log("Testing connection to:", safeUrl);

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT current_database() AS db, current_user AS "user"`;
  console.log("✅ Database connection successful!");
  console.log("   You can now run: npx prisma migrate dev");
  process.exit(0);
} catch (error) {
  console.error("❌ Database connection failed:\n");
  const msg = error.message || String(error);
  if (msg.includes("Authentication failed") || msg.includes("password authentication failed")) {
    console.error("   Wrong password for user 'postgres'.");
    console.error("\n   Fix in pgAdmin → Query Tool:");
    console.error("   ALTER USER postgres WITH PASSWORD '1221';");
    console.error('   CREATE DATABASE "Guesthouse_db";');
    console.error("\n   Or put your real PostgreSQL password in server/.env");
    console.error("\n   Full guide: server/DATABASE-SETUP.md");
  } else if (msg.includes("does not exist")) {
    console.error('   Database missing. Run in pgAdmin:');
    console.error('   CREATE DATABASE "Guesthouse_db";');
  } else {
    console.error("  ", msg.split("\n")[0]);
  }
  process.exit(1);
} finally {
  await prisma.$disconnect().catch(() => {});
}
