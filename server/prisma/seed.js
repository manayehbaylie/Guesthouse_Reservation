import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting safe database seed...");

  const password = await bcrypt.hash("password123", 10);

  // ============================================================
  // 1. ADMIN
  // ============================================================

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@gmail.com",
    },
    update: {
      role: "ADMIN",
    },
    create: {
      fullName: "System Administrator",
      email: "admin@gmail.com",
      password,
      phone: "+251933567890",
      role: "ADMIN",
    },
  });

  // ============================================================
  // 2. OWNER 1 - ADDIS ABABA
  // ============================================================

  const owner1 = await prisma.user.upsert({
    where: {
      email: "manayeh@gmail.com",
    },
    update: {
      role: "OWNER",
    },
    create: {
      fullName: "Manayeh Baylie",
      email: "manayeh@gmail.com",
      password,
      phone: "+251924392994",
      role: "OWNER",
    },
  });

  // ============================================================
  // 3. OWNER 2 - HAWASSA
  // ============================================================

  const owner2 = await prisma.user.upsert({
    where: {
      email: "sosina@gmail.com",
    },
    update: {
      role: "OWNER",
    },
    create: {
      fullName: "Sosina Shegaw",
      email: "sosina@gmail.com",
      password,
      phone: "+251922332233",
      role: "OWNER",
    },
  });

  // ============================================================
  // 4. OWNER 3 - BAHIR DAR
  // ============================================================

  const owner3 = await prisma.user.upsert({
    where: {
      email: "abel@gmail.com",
    },
    update: {
      role: "OWNER",
    },
    create: {
      fullName: "Abel Alemayehu",
      email: "abel@gmail.com",
      password,
      phone: "+251917777777",
      role: "OWNER",
    },
  });

  // ============================================================
  // 5. OWNER 4 - BISHOFTU
  // ============================================================

  const owner4 = await prisma.user.upsert({
    where: {
      email: "abebe@gmail.com",
    },
    update: {
      role: "OWNER",
    },
    create: {
      fullName: "Abebe Getachew",
      email: "abebe@gmail.com",
      password,
      phone: "+251918777777",
      role: "OWNER",
    },
  });

  // ============================================================
  // 6. OWNER 5 - LALIBELA
  // ============================================================

  const owner5 = await prisma.user.upsert({
    where: {
      email: "dani@gmail.com",
    },
    update: {
      role: "OWNER",
    },
    create: {
      fullName: "Dani Wondimu",
      email: "dani@gmail.com",
      password,
      phone: "+251919777777",
      role: "OWNER",
    },
  });

  // ============================================================
  // 7. RECEPTIONIST 1 - ADDIS ABABA
  // ============================================================

  const receptionist1 = await prisma.user.upsert({
    where: {
      email: "marta@gmail.com",
    },
    update: {
      role: "RECEPTIONIST",
    },
    create: {
      fullName: "Marta Haile",
      email: "marta@gmail.com",
      password,
      phone: "+251915555555",
      role: "RECEPTIONIST",
    },
  });

  // ============================================================
  // 8. RECEPTIONIST 2 - HAWASSA
  // ============================================================

  const receptionist2 = await prisma.user.upsert({
    where: {
      email: "dawit@gmail.com",
    },
    update: {
      role: "RECEPTIONIST",
    },
    create: {
      fullName: "Dawit Bekele",
      email: "dawit@gmail.com",
      password,
      phone: "+251916666666",
      role: "RECEPTIONIST",
    },
  });

  // ============================================================
  // 9. RECEPTIONIST 3 - BAHIR DAR
  // ============================================================

  const receptionist3 = await prisma.user.upsert({
    where: {
      email: "selam@gmail.com",
    },
    update: {
      role: "RECEPTIONIST",
    },
    create: {
      fullName: "Selamawit Bekele",
      email: "selam@gmail.com",
      password,
      phone: "+251915777777",
      role: "RECEPTIONIST",
    },
  });

  // ============================================================
  // 10. RECEPTIONIST 4 - BISHOFTU
  // ============================================================

  const receptionist4 = await prisma.user.upsert({
    where: {
      email: "nahom@gmail.com",
    },
    update: {
      role: "RECEPTIONIST",
    },
    create: {
      fullName: "Nahom Tesfaye",
      email: "nahom@gmail.com",
      password,
      phone: "+251916777777",
      role: "RECEPTIONIST",
    },
  });

  // ============================================================
  // 11. RECEPTIONIST 5 - LALIBELA
  // ============================================================

  const receptionist5 = await prisma.user.upsert({
    where: {
      email: "eden@gmail.com",
    },
    update: {
      role: "RECEPTIONIST",
    },
    create: {
      fullName: "Eden Worku",
      email: "eden@gmail.com",
      password,
      phone: "+251917888888",
      role: "RECEPTIONIST",
    },
  });

  // ============================================================
  // 12. GUEST 1
  // ============================================================

  const guest1 = await prisma.user.upsert({
    where: {
      email: "senayt@gmail.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Senayt Bikila",
      email: "senayt@gmail.com",
      password,
      phone: "+251911111111",
      role: "GUEST",
    },
  });

  // ============================================================
  // 13. GUEST 2
  // ============================================================

  const guest2 = await prisma.user.upsert({
    where: {
      email: "yonas@gmail.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Yonas Gebremedhin",
      email: "yonas@gmail.com",
      password,
      phone: "+251919876543",
      role: "GUEST",
    },
  });

  // ============================================================
  // 14. GUEST 3
  // ============================================================

  const guest3 = await prisma.user.upsert({
    where: {
      email: "hana@gmail.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Hana Tesfaye",
      email: "hana@gmail.com",
      password,
      phone: "+251918888888",
      role: "GUEST",
    },
  });

  // ============================================================
  // 15. GUEST 4
  // ============================================================

  const guest4 = await prisma.user.upsert({
    where: {
      email: "michael@gmail.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Michael Kebede",
      email: "michael@gmail.com",
      password,
      phone: "+251917123456",
      role: "GUEST",
    },
  });

  // ============================================================
  // 16. GUEST 5
  // ============================================================

  const guest5 = await prisma.user.upsert({
    where: {
      email: "rahel@gmail.com",
    },
    update: {
      role: "GUEST",
    },
    create: {
      fullName: "Rahel Worku",
      email: "rahel@gmail.com",
      password,
      phone: "+251918123456",
      role: "GUEST",
    },
  });

  // ============================================================
  // 17. GUESTHOUSE 1 - ADDIS ABABA
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
  // 18. GUESTHOUSE 2 - HAWASSA
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
  // 19. GUESTHOUSE 3 - BAHIR DAR
  // ============================================================

  let guesthouse3 = await prisma.guesthouse.findFirst({
    where: {
      name: "Blue Nile Riverside Guesthouse",
      ownerId: owner3.id,
    },
  });

  if (!guesthouse3) {
    guesthouse3 = await prisma.guesthouse.create({
      data: {
        name: "Blue Nile Riverside Guesthouse",
        address: "Lake Tana Road, Near Bahir Dar Lake",
        city: "Bahir Dar",
        description:
          "A comfortable guesthouse in Bahir Dar near Lake Tana and the Blue Nile, offering clean rooms and a relaxing environment.",
        image:
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
        status: "APPROVED",
        ownerId: owner3.id,
      },
    });
  }

  // ============================================================
  // 20. GUESTHOUSE 4 - BISHOFTU
  // ============================================================

  let guesthouse4 = await prisma.guesthouse.findFirst({
    where: {
      name: "Bishoftu Lake View Guesthouse",
      ownerId: owner4.id,
    },
  });

  if (!guesthouse4) {
    guesthouse4 = await prisma.guesthouse.create({
      data: {
        name: "Bishoftu Lake View Guesthouse",
        address: "Lake Babogaya Road",
        city: "Bishoftu",
        description:
          "A peaceful guesthouse in Bishoftu offering comfortable accommodation close to the beautiful crater lakes.",
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        status: "APPROVED",
        ownerId: owner4.id,
      },
    });
  }

  // ============================================================
  // 21. GUESTHOUSE 5 - LALIBELA
  // ============================================================

  let guesthouse5 = await prisma.guesthouse.findFirst({
    where: {
      name: "Lalibela Heritage Guesthouse",
      ownerId: owner5.id,
    },
  });

  if (!guesthouse5) {
    guesthouse5 = await prisma.guesthouse.create({
      data: {
        name: "Lalibela Heritage Guesthouse",
        address: "Lalibela Town, Near Rock-Hewn Churches",
        city: "Lalibela",
        description:
          "A welcoming guesthouse in Lalibela, conveniently located near the famous rock-hewn churches and historic attractions.",
        image:
          "https://images.unsplash.com/photo-1548013146-72479768bada",
        status: "APPROVED",
        ownerId: owner5.id,
      },
    });
  }

  // ============================================================
  // 22. STAFF ASSIGNMENT - ADDIS ABABA
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
  // 23. STAFF ASSIGNMENT - HAWASSA
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
  // 24. STAFF ASSIGNMENT - BAHIR DAR
  // ============================================================

  const assignment3 = await prisma.staffAssignment.findFirst({
    where: {
      guesthouseId: guesthouse3.id,
      staffId: receptionist3.id,
    },
  });

  if (!assignment3) {
    await prisma.staffAssignment.create({
      data: {
        guesthouseId: guesthouse3.id,
        staffId: receptionist3.id,
      },
    });
  }

  // ============================================================
  // 25. STAFF ASSIGNMENT - BISHOFTU
  // ============================================================

  const assignment4 = await prisma.staffAssignment.findFirst({
    where: {
      guesthouseId: guesthouse4.id,
      staffId: receptionist4.id,
    },
  });

  if (!assignment4) {
    await prisma.staffAssignment.create({
      data: {
        guesthouseId: guesthouse4.id,
        staffId: receptionist4.id,
      },
    });
  }

  // ============================================================
  // 26. STAFF ASSIGNMENT - LALIBELA
  // ============================================================

  const assignment5 = await prisma.staffAssignment.findFirst({
    where: {
      guesthouseId: guesthouse5.id,
      staffId: receptionist5.id,
    },
  });

  if (!assignment5) {
    await prisma.staffAssignment.create({
      data: {
        guesthouseId: guesthouse5.id,
        staffId: receptionist5.id,
      },
    });
  }

  // ============================================================
  // 27. ROOMS - ADDIS ABABA
  // ============================================================

  const addisRooms = [
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

  // ============================================================
  // 28. ROOMS - HAWASSA
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

  // ============================================================
  // 29. ROOMS - BAHIR DAR
  // ============================================================

  const bahirDarRooms = [
    {
      roomNumber: "301",
      roomType: "SINGLE",
      price: 1100,
      capacity: 1,
    },
    {
      roomNumber: "302",
      roomType: "DOUBLE",
      price: 1700,
      capacity: 2,
    },
    {
      roomNumber: "303",
      roomType: "TWIN",
      price: 1900,
      capacity: 2,
    },
    {
      roomNumber: "304",
      roomType: "SUITE",
      price: 3200,
      capacity: 3,
    },
    {
      roomNumber: "305",
      roomType: "FAMILY",
      price: 4000,
      capacity: 4,
    },
  ];

  // ============================================================
  // 30. ROOMS - BISHOFTU
  // ============================================================

  const bishoftuRooms = [
    {
      roomNumber: "401",
      roomType: "SINGLE",
      price: 1000,
      capacity: 1,
    },
    {
      roomNumber: "402",
      roomType: "DOUBLE",
      price: 1600,
      capacity: 2,
    },
    {
      roomNumber: "403",
      roomType: "TWIN",
      price: 1800,
      capacity: 2,
    },
    {
      roomNumber: "404",
      roomType: "SUITE",
      price: 3000,
      capacity: 3,
    },
    {
      roomNumber: "405",
      roomType: "FAMILY",
      price: 3800,
      capacity: 4,
    },
  ];

  // ============================================================
  // 31. ROOMS - LALIBELA
  // ============================================================

  const lalibelaRooms = [
    {
      roomNumber: "501",
      roomType: "SINGLE",
      price: 1200,
      capacity: 1,
    },
    {
      roomNumber: "502",
      roomType: "DOUBLE",
      price: 1800,
      capacity: 2,
    },
    {
      roomNumber: "503",
      roomType: "TWIN",
      price: 2000,
      capacity: 2,
    },
    {
      roomNumber: "504",
      roomType: "SUITE",
      price: 3500,
      capacity: 3,
    },
    {
      roomNumber: "505",
      roomType: "FAMILY",
      price: 4300,
      capacity: 4,
    },
  ];

  // ============================================================
  // 32. CREATE ALL ROOMS
  // ============================================================

  const roomGroups = [
    {
      guesthouse: guesthouse1,
      rooms: addisRooms,
    },
    {
      guesthouse: guesthouse2,
      rooms: hawassaRooms,
    },
    {
      guesthouse: guesthouse3,
      rooms: bahirDarRooms,
    },
    {
      guesthouse: guesthouse4,
      rooms: bishoftuRooms,
    },
    {
      guesthouse: guesthouse5,
      rooms: lalibelaRooms,
    },
  ];

  for (const group of roomGroups) {
    for (const room of group.rooms) {
      await prisma.room.upsert({
        where: {
          guesthouseId_roomNumber: {
            guesthouseId: group.guesthouse.id,
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
          guesthouseId: group.guesthouse.id,
        },
      });
    }
  }

  // ============================================================
  // 33. GET ROOMS
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

  const room301 = await prisma.room.findUnique({
    where: {
      guesthouseId_roomNumber: {
        guesthouseId: guesthouse3.id,
        roomNumber: "301",
      },
    },
  });

  const room401 = await prisma.room.findUnique({
    where: {
      guesthouseId_roomNumber: {
        guesthouseId: guesthouse4.id,
        roomNumber: "401",
      },
    },
  });

  const room501 = await prisma.room.findUnique({
    where: {
      guesthouseId_roomNumber: {
        guesthouseId: guesthouse5.id,
        roomNumber: "501",
      },
    },
  });

  // ============================================================
  // 34. RESERVATION - ADDIS ABABA
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
          amount: 2400,
          method: "TELEBIRR",
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // 35. RESERVATION - ADDIS ABABA ROOM 102
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
          method: "BANK_TRANSFER", // ✅ Changed from CBE_BIRR
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // 36. RESERVATION - HAWASSA
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
          amount: 2000,
          method: "CHAPA",
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // 37. RESERVATION - BAHIR DAR
  // ============================================================

  if (room301) {
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        guestId: guest4.id,
        roomId: room301.id,
      },
    });

    if (!existingReservation) {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 3);

      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 5);

      const reservation = await prisma.reservation.create({
        data: {
          guestId: guest4.id,
          roomId: room301.id,
          checkIn,
          checkOut,
          status: "CONFIRMED",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 2200,
          method: "TELEBIRR",
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // 38. RESERVATION - BISHOFTU
  // ============================================================

  if (room401) {
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        guestId: guest5.id,
        roomId: room401.id,
      },
    });

    if (!existingReservation) {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 4);

      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 6);

      const reservation = await prisma.reservation.create({
        data: {
          guestId: guest5.id,
          roomId: room401.id,
          checkIn,
          checkOut,
          status: "CONFIRMED",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 2000,
          method: "BANK_TRANSFER", // ✅ Changed from CBE_BIRR
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // 39. RESERVATION - LALIBELA
  // ============================================================

  if (room501) {
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        guestId: guest1.id,
        roomId: room501.id,
      },
    });

    if (!existingReservation) {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 5);

      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 7);

      const reservation = await prisma.reservation.create({
        data: {
          guestId: guest1.id,
          roomId: room501.id,
          checkIn,
          checkOut,
          status: "CONFIRMED",
        },
      });

      await prisma.payment.create({
        data: {
          amount: 2400,
          method: "CHAPA",
          status: "PAID",
          reservationId: reservation.id,
        },
      });
    }
  }

  // ============================================================
  // FINAL OUTPUT
  // ============================================================

  console.log("");
  console.log("==============================================");
  console.log("✅ SAFE SEED COMPLETED SUCCESSFULLY");
  console.log("==============================================");

  console.log("");
  console.log("ADMIN");
  console.log("Email: admin@gmail.com");
  console.log("Password: password123");

  console.log("");
  console.log("OWNER 1");
  console.log("Email: manayeh@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Lucy Heritage Guesthouse");
  console.log("City: Addis Ababa");

  console.log("");
  console.log("OWNER 2");
  console.log("Email: sosina@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Hawassa Lake View Guesthouse");
  console.log("City: Hawassa");

  console.log("");
  console.log("OWNER 3");
  console.log("Email: abel@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Blue Nile Riverside Guesthouse");
  console.log("City: Bahir Dar");

  console.log("");
  console.log("OWNER 4");
  console.log("Email: abebe@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Bishoftu Lake View Guesthouse");
  console.log("City: Bishoftu");

  console.log("");
  console.log("OWNER 5");
  console.log("Email: dani@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Lalibela Heritage Guesthouse");
  console.log("City: Lalibela");

  console.log("");
  console.log("RECEPTIONIST 1");
  console.log("Email: marta@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Lucy Heritage Guesthouse");

  console.log("");
  console.log("RECEPTIONIST 2");
  console.log("Email: dawit@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Hawassa Lake View Guesthouse");

  console.log("");
  console.log("RECEPTIONIST 3");
  console.log("Email: selam@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Blue Nile Riverside Guesthouse");

  console.log("");
  console.log("RECEPTIONIST 4");
  console.log("Email: nahom@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Bishoftu Lake View Guesthouse");

  console.log("");
  console.log("RECEPTIONIST 5");
  console.log("Email: eden@gmail.com");
  console.log("Password: password123");
  console.log("Guesthouse: Lalibela Heritage Guesthouse");

  console.log("");
  console.log("==============================================");
  console.log("5 GUESTHOUSES CREATED");
  console.log("==============================================");
  console.log("1. Addis Ababa - Lucy Heritage Guesthouse");
  console.log("2. Hawassa - Hawassa Lake View Guesthouse");
  console.log("3. Bahir Dar - Blue Nile Riverside Guesthouse");
  console.log("4. Bishoftu - Bishoftu Lake View Guesthouse");
  console.log("5. Lalibela - Lalibela Heritage Guesthouse");
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