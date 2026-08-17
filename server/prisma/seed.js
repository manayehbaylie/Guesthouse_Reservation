import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // =====================================================
  // PASSWORD
  // =====================================================
  const password = await bcrypt.hash("Password123", 10);

  // =====================================================
  // CLEAR OLD DEMO DATA
  // =====================================================
  console.log("🧹 Clearing old demo data...");

  // Delete dependent records FIRST
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.room.deleteMany();
  await prisma.guesthouse.deleteMany();

  // Delete users last
  await prisma.user.deleteMany();

  console.log("✅ Old demo data cleared");

  // =====================================================
  // ADMIN
  // =====================================================
  const admin = await prisma.user.create({
    data: {
      fullName: "System Administrator",
      email: "admin@example.com",
      password,
      phone: "+251933333333",
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created");

  // =====================================================
  // OWNERS
  // =====================================================
  const owner1 = await prisma.user.create({
    data: {
      fullName: "Abebe Guesthouse Owner",
      email: "owner1@example.com",
      password,
      phone: "+251911111111",
      role: "OWNER",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      fullName: "Sara Guesthouse Owner",
      email: "owner2@example.com",
      password,
      phone: "+251922222222",
      role: "OWNER",
    },
  });

  console.log("✅ Demo owners created");

  // =====================================================
  // GUEST
  // =====================================================
  const guest = await prisma.user.create({
    data: {
      fullName: "Demo Guest",
      email: "guest@example.com",
      password,
      phone: "+251933444444",
      role: "GUEST",
    },
  });

  console.log("✅ Demo guest created");

  // =====================================================
  // RECEPTIONIST
  // =====================================================
  const receptionist = await prisma.user.create({
    data: {
      fullName: "Demo Receptionist",
      email: "receptionist@example.com",
      password,
      phone: "+251944555555",
      role: "RECEPTIONIST",
    },
  });

  console.log("✅ Demo receptionist created");

  // =====================================================
  // GUESTHOUSE 1
  // =====================================================
  const guesthouse1 = await prisma.guesthouse.create({
    data: {
      name: "Bole Comfort Guesthouse",
      address: "Bole, Addis Ababa",
      city: "Addis Ababa",
      description:
        "A comfortable guesthouse located in Bole with clean rooms and modern facilities.",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      status: "APPROVED",
      ownerId: owner1.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 2
  // =====================================================
  const guesthouse2 = await prisma.guesthouse.create({
    data: {
      name: "Addis Garden Guesthouse",
      address: "Kazanchis, Addis Ababa",
      city: "Addis Ababa",
      description:
        "A peaceful guesthouse offering comfortable accommodation in the heart of Addis Ababa.",
      image:
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
      status: "APPROVED",
      ownerId: owner1.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 3
  // =====================================================
  const guesthouse3 = await prisma.guesthouse.create({
    data: {
      name: "Hawassa Lake View",
      address: "Hawassa",
      city: "Hawassa",
      description:
        "A relaxing guesthouse close to Lake Hawassa with beautiful surroundings.",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
      status: "APPROVED",
      ownerId: owner2.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 4
  // =====================================================
  const guesthouse4 = await prisma.guesthouse.create({
    data: {
      name: "Bahir Dar Lakeside Guesthouse",
      address: "Bahir Dar",
      city: "Bahir Dar",
      description:
        "A comfortable guesthouse close to Lake Tana and the city center.",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
      status: "APPROVED",
      ownerId: owner2.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 5
  // =====================================================
  const guesthouse5 = await prisma.guesthouse.create({
    data: {
      name: "Bishoftu Paradise Guesthouse",
      address: "Bishoftu",
      city: "Bishoftu",
      description:
        "A peaceful guesthouse near the beautiful lakes of Bishoftu.",
      image:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
      status: "APPROVED",
      ownerId: owner1.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 6
  // =====================================================
  const guesthouse6 = await prisma.guesthouse.create({
    data: {
      name: "Lalibela Heritage Guesthouse",
      address: "Lalibela",
      city: "Lalibela",
      description:
        "A traditional and comfortable guesthouse near the famous Lalibela churches.",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      status: "APPROVED",
      ownerId: owner2.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 7
  // =====================================================
  const guesthouse7 = await prisma.guesthouse.create({
    data: {
      name: "Addis Heights Guesthouse",
      address: "Yeka, Addis Ababa",
      city: "Addis Ababa",
      description:
        "Modern guesthouse with comfortable rooms and excellent city views.",
      image:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
      status: "APPROVED",
      ownerId: owner1.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 8
  // =====================================================
  const guesthouse8 = await prisma.guesthouse.create({
    data: {
      name: "Hawassa Green Garden",
      address: "Hawassa",
      city: "Hawassa",
      description:
        "A quiet and relaxing guesthouse suitable for families and travelers.",
      image:
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
      status: "APPROVED",
      ownerId: owner2.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 9
  // =====================================================
  const guesthouse9 = await prisma.guesthouse.create({
    data: {
      name: "Bahir Dar Blue Lake Guesthouse",
      address: "Bahir Dar",
      city: "Bahir Dar",
      description:
        "Comfortable accommodation close to Lake Tana and local attractions.",
      image:
        "https://images.unsplash.com/photo-1601918774946-25832a4be0d6",
      status: "APPROVED",
      ownerId: owner2.id,
    },
  });

  // =====================================================
  // GUESTHOUSE 10
  // =====================================================
  const guesthouse10 = await prisma.guesthouse.create({
    data: {
      name: "Bishoftu Lake Resort Guesthouse",
      address: "Bishoftu",
      city: "Bishoftu",
      description:
        "A beautiful guesthouse offering a relaxing stay near Bishoftu's lakes.",
      image:
        "https://images.unsplash.com/photo-1582610116397-edb318620f90",
      status: "APPROVED",
      ownerId: owner1.id,
    },
  });

  console.log("✅ Demo guesthouses created");

  // =====================================================
  // ROOMS
  // =====================================================
  await prisma.room.createMany({
    data: [
      // Bole Comfort
      {
        roomNumber: "101",
        roomType: "SINGLE",
        price: 1200,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse1.id,
      },
      {
        roomNumber: "102",
        roomType: "DOUBLE",
        price: 2000,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse1.id,
      },
      {
        roomNumber: "103",
        roomType: "SUITE",
        price: 3500,
        capacity: 3,
        available: true,
        guesthouseId: guesthouse1.id,
      },

      // Addis Garden
      {
        roomNumber: "201",
        roomType: "SINGLE",
        price: 1300,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse2.id,
      },
      {
        roomNumber: "202",
        roomType: "DOUBLE",
        price: 2200,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse2.id,
      },
      {
        roomNumber: "203",
        roomType: "FAMILY",
        price: 3200,
        capacity: 4,
        available: true,
        guesthouseId: guesthouse2.id,
      },

      // Hawassa Lake View
      {
        roomNumber: "301",
        roomType: "SINGLE",
        price: 1000,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse3.id,
      },
      {
        roomNumber: "302",
        roomType: "DOUBLE",
        price: 1800,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse3.id,
      },
      {
        roomNumber: "303",
        roomType: "SUITE",
        price: 3000,
        capacity: 3,
        available: true,
        guesthouseId: guesthouse3.id,
      },

      // Bahir Dar Lakeside
      {
        roomNumber: "401",
        roomType: "SINGLE",
        price: 1100,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse4.id,
      },
      {
        roomNumber: "402",
        roomType: "TWIN",
        price: 1900,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse4.id,
      },
      {
        roomNumber: "403",
        roomType: "FAMILY",
        price: 2800,
        capacity: 4,
        available: true,
        guesthouseId: guesthouse4.id,
      },

      // Bishoftu Paradise
      {
        roomNumber: "501",
        roomType: "SINGLE",
        price: 1000,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse5.id,
      },
      {
        roomNumber: "502",
        roomType: "DOUBLE",
        price: 1800,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse5.id,
      },

      // Lalibela Heritage
      {
        roomNumber: "601",
        roomType: "SINGLE",
        price: 900,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse6.id,
      },
      {
        roomNumber: "602",
        roomType: "DOUBLE",
        price: 1600,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse6.id,
      },

      // Addis Heights
      {
        roomNumber: "701",
        roomType: "SINGLE",
        price: 1400,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse7.id,
      },
      {
        roomNumber: "702",
        roomType: "DOUBLE",
        price: 2300,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse7.id,
      },

      // Hawassa Green Garden
      {
        roomNumber: "801",
        roomType: "SINGLE",
        price: 1100,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse8.id,
      },
      {
        roomNumber: "802",
        roomType: "FAMILY",
        price: 2500,
        capacity: 4,
        available: true,
        guesthouseId: guesthouse8.id,
      },

      // Bahir Dar Blue Lake
      {
        roomNumber: "901",
        roomType: "DOUBLE",
        price: 2000,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse9.id,
      },
      {
        roomNumber: "902",
        roomType: "SUITE",
        price: 3200,
        capacity: 3,
        available: true,
        guesthouseId: guesthouse9.id,
      },

      // Bishoftu Lake Resort
      {
        roomNumber: "1001",
        roomType: "SINGLE",
        price: 1200,
        capacity: 1,
        available: true,
        guesthouseId: guesthouse10.id,
      },
      {
        roomNumber: "1002",
        roomType: "DOUBLE",
        price: 2100,
        capacity: 2,
        available: true,
        guesthouseId: guesthouse10.id,
      },
    ],
  });

  console.log("✅ Demo rooms created");

  console.log("");
  console.log("======================================");
  console.log("🌱 DATABASE SEED COMPLETED");
  console.log("======================================");
  console.log("");
  console.log("Demo accounts:");
  console.log("");
  console.log("ADMIN");
  console.log("Email: admin@example.com");
  console.log("Password: Password123");
  console.log("");
  console.log("OWNER 1");
  console.log("Email: owner1@example.com");
  console.log("Password: Password123");
  console.log("");
  console.log("OWNER 2");
  console.log("Email: owner2@example.com");
  console.log("Password: Password123");
  console.log("");
  console.log("GUEST");
  console.log("Email: guest@example.com");
  console.log("Password: Password123");
  console.log("");
  console.log("RECEPTIONIST");
  console.log("Email: receptionist@example.com");
  console.log("Password: Password123");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });