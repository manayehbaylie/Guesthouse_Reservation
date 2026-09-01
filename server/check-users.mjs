import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    console.log("\n=== ALL USERS IN DATABASE ===\n");
    if (users.length === 0) {
      console.log("No users found in database.\n");
    } else {
      users.forEach((user) => {
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.fullName}`);
        console.log(`Email: ${user.email}`);
        console.log(`Phone: ${user.phone}`);
        console.log(`Role: ${user.role}`);
        console.log("---");
      });
    }

    console.log("\n✅ Database check complete.\n");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
