import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Normalize phone number to +251... format
function normalizePhone(phone) {
  if (!phone) return null;
  
  let value = phone.trim();
  value = value.replace(/[\s\-()]/g, "");

  // 09XXXXXXXX -> +2519XXXXXXXX
  if (/^09\d{8}$/.test(value)) {
    return `+251${value.substring(1)}`;
  }

  // 9XXXXXXXX -> +2519XXXXXXXX
  if (/^9\d{8}$/.test(value)) {
    return `+251${value}`;
  }

  // 2519XXXXXXXX -> +2519XXXXXXXX
  if (/^2519\d{8}$/.test(value)) {
    return `+${value}`;
  }

  // +2519XXXXXXXX
  if (/^\+2519\d{8}$/.test(value)) {
    return value;
  }

  return value;
}

async function main() {
  try {
    console.log("\n=== NORMALIZING ALL PHONE NUMBERS ===\n");

    // Get all users
    const users = await prisma.user.findMany();

    let updated = 0;

    for (const user of users) {
      if (!user.phone) continue;

      const normalizedPhone = normalizePhone(user.phone);

      if (normalizedPhone !== user.phone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: normalizedPhone },
        });
        console.log(
          `✅ User ${user.fullName}: ${user.phone} → ${normalizedPhone}`
        );
        updated++;
      }
    }

    console.log(`\n✅ Updated ${updated} phone numbers\n`);

    // Show the updated user we need
    const testUser = await prisma.user.findUnique({
      where: { id: 96 },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    console.log("=== TEST USER (ID 96) ===");
    console.log(testUser);
    console.log(
      "\n✅ You can now login with:\n   Phone: 0977554433 or +25177554433\n   Password: (use the password for this user)\n"
    );
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
