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
    console.log("\n=== FINDING DUPLICATE PHONES AFTER NORMALIZATION ===\n");

    const users = await prisma.user.findMany();
    const normalizedMap = new Map();
    const duplicates = [];

    // Find potential duplicates
    for (const user of users) {
      if (!user.phone) continue;
      const normalized = normalizePhone(user.phone);
      
      if (normalizedMap.has(normalized)) {
        duplicates.push({
          duplicate: {
            id: user.id,
            name: user.fullName,
            original: user.phone,
            normalized,
          },
          original: normalizedMap.get(normalized),
        });
      } else {
        normalizedMap.set(normalized, {
          id: user.id,
          name: user.fullName,
          original: user.phone,
        });
      }
    }

    if (duplicates.length > 0) {
      console.log("⚠️  DUPLICATES FOUND (keeping first, deleting second):\n");
      for (const dup of duplicates) {
        console.log(
          `   Keep: ID ${dup.original.id} (${dup.original.name}): ${dup.original.original}`
        );
        console.log(
          `   DELETE: ID ${dup.duplicate.id} (${dup.duplicate.name}): ${dup.duplicate.original}`
        );
        console.log("");
      }

      // Delete duplicates (keep the one with lower ID)
      for (const dup of duplicates) {
        console.log(`❌ Deleting user ID ${dup.duplicate.id}...`);
        await prisma.user.delete({
          where: { id: dup.duplicate.id },
        });
      }
    } else {
      console.log("✅ No duplicates found after normalization\n");
    }

    console.log("\n=== NOW NORMALIZING ALL PHONES ===\n");

    const updatedUsers = await prisma.user.findMany();
    let updated = 0;

    for (const user of updatedUsers) {
      if (!user.phone) continue;

      const normalizedPhone = normalizePhone(user.phone);

      if (normalizedPhone !== user.phone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: normalizedPhone },
        });
        console.log(
          `✅ ${user.fullName}: ${user.phone} → ${normalizedPhone}`
        );
        updated++;
      }
    }

    console.log(`\n✅ Updated ${updated} phone numbers\n`);

    // Show the target user
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

    if (testUser) {
      console.log("=== TEST LOGIN USER ===");
      console.log(`Name: ${testUser.fullName}`);
      console.log(`Email: ${testUser.email}`);
      console.log(`Phone: ${testUser.phone}`);
      console.log(`Role: ${testUser.role}`);
      console.log("\n✅ You can now login with:");
      console.log("   Phone: 0977554433 or +25177554433");
      console.log("   (Password: use the password for this account)");
      console.log("");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
