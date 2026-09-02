import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("\n=== APPROVING ALL PENDING GUESTHOUSES ===\n");

    // Get all pending guesthouses
    const pendingGuesthouses = await prisma.guesthouse.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        city: true,
        ownerId: true,
      },
    });

    if (pendingGuesthouses.length === 0) {
      console.log("✅ No pending guesthouses to approve\n");
      return;
    }

    console.log(`Found ${pendingGuesthouses.length} pending guesthouse(s):`);
    pendingGuesthouses.forEach((gh, index) => {
      console.log(`  ${index + 1}. ${gh.name} (${gh.city})`);
    });
    console.log("");

    // Approve all pending guesthouses
    const updated = await prisma.guesthouse.updateMany({
      where: {
        status: "PENDING",
      },
      data: {
        status: "APPROVED",
        rejectionReason: null,
      },
    });

    console.log(`✅ Successfully approved ${updated.count} guesthouse(s)\n`);

    // Show updated summary
    const summary = await prisma.guesthouse.groupBy({
      by: ["status"],
      _count: true,
    });

    console.log("Updated Status Summary:");
    summary.forEach((item) => {
      console.log(`  ${item.status}: ${item._count} guesthouse(s)`);
    });
    console.log("");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
