import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting safe database seed...");

  const password = await bcrypt.hash("Password123", 10);

  // ============================================================
  // 1. ADMIN
  // ============================================================

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {
      role: "ADMIN",
    },
    create: {
      fullName: "System Administrator",
      email: "admin@example.com",
      password,
      phone: "+251933333333",
      role: "ADMIN",
    },
  });

  // ============================================================
  // 2. OWNER 1
  // ============================================================

  const owner1 = await prisma.user.upsert({
    where: {
      email: "solomon@example.com",
    },
    update: {
      role: "OWNER",
    },
    create: {
      fullName: "Solomon Tadesse",
      email: "solomon@example.com",
      password,
      phone: "+251911111113",
      role: "OWNER",
    },
  });

  // ============================================================
  // 3. OWNER 2
  // ============================================================

  const owner2 = await prisma.user.upsert({
    where: {
      email: "sara@example.com",
    },
    update: {
      role: "OWNER",
    },
    create: {
      fullName: "Sara Alemu",
      email: "sara@example.com",
      password,
      phone: "+251922222222",
      role: "OWNER",
    },
  });

  // ============================================================
  // 4. RECEPTIONIST 1
  // ============================================================

  const receptionist1 = await prisma.user.upsert({
    where: {
      email: "marta@example.com",
    },
    update: {
      role: "RECEPTIONIST",
    },
    create: {
      fullName: "Marta Haile",
      email: "marta@example.com",
      password,
      phone: "+251915555555",
      role: "RECEPTIONIST",
    },
  });

  // ============================================================
  // 5. RECEPTIONIST 2
  // ============================================================

  const receptionist2 = await prisma.user.upsert({
    where: {
      email: "dawit@example.com",
    },
    update: {
      role: "RECEPTIONIST",
    },
    create: {
      fullName: "Dawit Bekele",
      email: "dawit@example.com",
      password,
      phone: "+251916666666",
      role: "RECEPTIONIST",
    },
  });

  // ============================================================
  // 6. GUEST 1
  // ============================================================

  const guest1 = await prisma.user.upsert({
    where: {
      email: "abebe@example.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Abebe Bikila",
      email: "abebe@example.com",
      password,
      phone: "+251911111111",
      role: "GUEST",
    },
  });

  // ============================================================
  // 7. GUEST 2
  // ============================================================

  const guest2 = await prisma.user.upsert({
    where: {
      email: "yonas@example.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Yonas Gebremedhin",
      email: "yonas@example.com",
      password,
      phone: "+251919876543",
      role: "GUEST",
    },
  });

  // ============================================================
  // 8. GUEST 3
  // ============================================================

  const guest3 = await prisma.user.upsert({
    where: {
      email: "hana@example.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Hana Tesfaye",
      email: "hana@example.com",
      password,
      phone: "+251918888888",
      role: "GUEST",
    },
  });

  // ============================================================
  // 9. GUESTHOUSE 1
  // OWNER: SOLOMON
  // RECEPTIONIST: MARTA
  // ============================================================

  let guesthouse1 = await prisma.guesthouse.findFirst({
    where: {
      name: "Lucy Heritage Guesthouse",
      ownerId: owner1.id,
    },
  });

  if (!guesthouse1) {
    guesthouse1 = await prisma.guesthouse.create({
      data: {
        name: "Lucy Heritage Guesthouse",
        address: "Bole Road, Near Edna Mall",
        city: "Addis Ababa",
        description:
          "A comfortable guesthouse in Bole with modern rooms, clean facilities and convenient access to Addis Ababa.",
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        status: "APPROVED",
        ownerId: owner1.id,
      },
    });
  }

  // ============================================================
  // 10. GUESTHOUSE 2
  // OWNER: SARA
  // RECEPTIONIST: DAWIT
  // ============================================================

  let guesthouse2 = await prisma.guesthouse.findFirst({
    where: {
      name: "Hawassa Lake View Guesthouse",
      ownerId: owner2.id,
    },
  });

  if (!guesthouse2) {
    guesthouse2 = await prisma.guesthouse.create({
      data: {
        name: "Hawassa Lake View Guesthouse",
        address: "Lake Road, Near Hawassa Lake",
        city: "Hawassa",
        description:
          "A peaceful guesthouse near Lake Hawassa offering comfortable rooms and beautiful lake surroundings.",
        image:
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        status: "APPROVED",
        ownerId: owner2.id,
      },
    });
  }

  // ============================================================
  // 11. STAFF ASSIGNMENT
  // MARTA -> LUCY HERITAGE
  // ============================================================

  const assignment1 = await prisma.staffAssignment.findFirst({
    where: {
      guesthouseId: guesthouse1.id,
      staffId: receptionist1.id,
    },
  });

  if (!assignment1) {
    await prisma.staffAssignment.create({
      data: {
        guesthouseId: guesthouse1.id,
        staffId: receptionist1.id,
      },
    });
  }

  // ============================================================
  // 12. STAFF ASSIGNMENT
  // DAWIT -> HAWASSA LAKE VIEW
  // ============================================================

  const assignment2 = await prisma.staffAssignment.findFirst({
    where: {
      guesthouseId: guesthouse2.id,
      staffId: receptionist2.id,
    },
  });

  if (!assignment2) {
    await prisma.staffAssignment.create({
      data: {
        guesthouseId: guesthouse2.id,
        staffId: receptionist2.id,
      },
    });
  }

  // ============================================================
  // 13. ROOMS FOR LUCY HERITAGE
  // ============================================================

  const lucyRooms = [
    {
      roomNumber: "101",
      roomType: "SINGLE",
      price: 1200,
      capacity: 1,
    },
    {
      roomNumber: "102",
      roomType: "DOUBLE",
      price: 1800,
      capacity: 2,
    },
    {
      roomNumber: "103",
      roomType: "TWIN",
      price: 2000,
      capacity: 2,
    },
    {
      roomNumber: "104",
      roomType: "SUITE",
      price: 3500,
      capacity: 3,
    },
    {
      roomNumber: "105",
      roomType: "FAMILY",
      price: 4200,
      capacity: 4,
    },
  ];

  for (const room of lucyRooms) {
    await prisma.room.upsert({
      where: {
        guesthouseId_roomNumber: {
          guesthouseId: guesthouse1.id,
          roomNumber: room.roomNumber,
        },
      },
      update: {
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
      },
      create: {
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        available: true,
        maintenanceStatus: "AVAILABLE",
        guesthouseId: guesthouse1.id,
      },
    });
  }

  // ============================================================
  // 14. ROOMS FOR HAWASSA LAKE VIEW
  // ============================================================

  const hawassaRooms = [
    {
      roomNumber: "201",
      roomType: "SINGLE",
      price: 1000,
      capacity: 1,
    },
    {
      roomNumber: "202",
      roomType: "DOUBLE",
      price: 1600,
      capacity: 2,
    },
    {
      roomNumber: "203",
      roomType: "TWIN",
      price: 1900,
      capacity: 2,
    },
    {
      roomNumber: "204",
      roomType: "SUITE",
      price: 3000,
      capacity: 3,
    },
    {
      roomNumber: "205",
      roomType: "FAMILY",
      price: 3800,
      capacity: 4,
    },
  ];

  for (const room of hawassaRooms) {
    await prisma.room.upsert({
      where: {
        guesthouseId_roomNumber: {
          guesthouseId: guesthouse2.id,
          roomNumber: room.roomNumber,
        },
      },
      update: {
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
      },
      create: {
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        available: true,
        maintenanceStatus: "AVAILABLE",
        guesthouseId: guesthouse2.id,
      },
    });
  }

  // ============================================================
  // 15. GET ROOMS
  // ============================================================

  const room101 = await prisma.room.findUnique({
    where: {
      guesthouseId_roomNumber: {
        guesthouseId: guesthouse1.id,
        roomNumber: "101",
      },
    },
  });

  const room102 = await prisma.room.findUnique({
    where: {
      guesthouseId_roomNumber: {
        guesthouseId: guesthouse1.id,
        roomNumber: "102",
      },
    },
  });

  const room201 = await prisma.room.findUnique({
    where: {
      guesthouseId_roomNumber: {
        guesthouseId: guesthouse2.id,
        roomNumber: "201",
      },
    },
  });

  // ============================================================
  // 16. RESERVATION FOR LUCY HERITAGE
  // ============================================================

  if (room101) {
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        guestId: guest1.id,
        roomId: room101.id,
      },
    });

    if (!existingReservation) {
      const checkIn = new Date();

      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 2);

      const reservation = await prisma.reservation.create({
        data: {
          guestId: guest1.id,
          roomId: room101.id,
          checkIn,
          checkOut,
          status: "CONFIRMED",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 3600,
          method: "TELEBIRR",
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // 17. SECOND RESERVATION FOR LUCY HERITAGE
  // ============================================================

  if (room102) {
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        guestId: guest2.id,
        roomId: room102.id,
      },
    });

    if (!existingReservation) {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 1);

      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 3);

      const reservation = await prisma.reservation.create({
        data: {
          guestId: guest2.id,
          roomId: room102.id,
          checkIn,
          checkOut,
          status: "CONFIRMED",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 3600,
          method: "CBE_BIRR",
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // 18. RESERVATION FOR HAWASSA
  // ============================================================

  if (room201) {
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        guestId: guest3.id,
        roomId: room201.id,
      },
    });

    if (!existingReservation) {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 2);

      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4);

      const reservation = await prisma.reservation.create({
        data: {
          guestId: guest3.id,
          roomId: room201.id,
          checkIn,
          checkOut,
          status: "CONFIRMED",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 3200,
          method: "CHAPA",
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  console.log("");
  console.log("==============================================");
  console.log("✅ SAFE SEED COMPLETED");
  console.log("==============================================");

  console.log("");
  console.log("ADMIN");
  console.log("Email: admin@example.com");
  console.log("Password: Password123");

  console.log("");
  console.log("OWNER 1");
  console.log("Email: solomon@example.com");
  console.log("Password: Password123");
  console.log("Guesthouse: Lucy Heritage Guesthouse");

  console.log("");
  console.log("RECEPTIONIST 1");
  console.log("Email: marta@example.com");
  console.log("Password: Password123");
  console.log("Guesthouse: Lucy Heritage Guesthouse");

  console.log("");
  console.log("OWNER 2");
  console.log("Email: sara@example.com");
  console.log("Password: Password123");
  console.log("Guesthouse: Hawassa Lake View Guesthouse");

  console.log("");
  console.log("RECEPTIONIST 2");
  console.log("Email: dawit@example.com");
  console.log("Password: Password123");
  console.log("Guesthouse: Hawassa Lake View Guesthouse");

  console.log("");
  console.log("GUEST 1");
  console.log("Email: abebe@example.com");
  console.log("Password: Password123");

  console.log("");
  console.log("GUEST 2");
  console.log("Email: yonas@example.com");
  console.log("Password: Password123");

  console.log("");
  console.log("GUEST 3");
  console.log("Email: hana@example.com");
  console.log("Password: Password123");

  console.log("");
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });