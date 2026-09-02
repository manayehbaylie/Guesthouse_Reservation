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
    console.log("\n=== NORMALIZING TARGET USER PHONE ===\n");

    // Just update the one user we need
    const targetUser = await prisma.user.findUnique({
      where: { id: 96 },
    });

    if (!targetUser) {
      console.log("❌ User ID 96 not found\n");
      return;
    }

    const normalizedPhone = normalizePhone(targetUser.phone);

    if (normalizedPhone === targetUser.phone) {
      console.log(`✅ User phone already normalized: ${normalizedPhone}\n`);
    } else {
      // Check if this normalized phone already exists
      const existing = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existing && existing.id !== 96) {
        console.log(
          `⚠️  Phone ${normalizedPhone} already exists for user ID ${existing.id}`
        );
        console.log(`    Keeping original: ${targetUser.phone}\n`);
      } else {
        await prisma.user.update({
          where: { id: 96 },
          data: { phone: normalizedPhone },
        });
        console.log(
          `✅ Updated user 96: ${targetUser.phone} → ${normalizedPhone}\n`
        );
      }
    }

    // Show the updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: 96 },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    console.log("=== TEST LOGIN USER (ID 96) ===");
    console.log(`Name: ${updatedUser.fullName}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Phone: ${updatedUser.phone}`);
    console.log(`Role: ${updatedUser.role}`);
    console.log("\n✅ LOGIN INSTRUCTIONS:");
    console.log("   Method: Phone");
    console.log(`   Phone: 0977554433 (will be normalized to ${updatedUser.phone})`);
    console.log("   Password: (use the password for this account)");
    console.log("");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
