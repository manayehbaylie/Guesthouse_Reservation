import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // =========================
  // PASSWORD
  // =========================
  const password = await bcrypt.hash("Password123", 10);
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
  // =========================
  // OWNERS
  // =========================
  const owner1 = await prisma.user.upsert({
    where: {
      email: "owner1@example.com",
    },
    update: {},
    create: {
      fullName: "Abebe Guesthouse Owner",
      email: "owner1@example.com",
      password,
      phone: "+251911111111",
      role: "OWNER",
    },
  });

  const owner2 = await prisma.user.upsert({
    where: {
      email: "owner2@example.com",
    },
    update: {},
    create: {
      fullName: "Sara Guesthouse Owner",
      email: "owner2@example.com",
      password,
      phone: "+251922222222",
      role: "OWNER",
    },
  });

  // =========================
  // GUESTHOUSES
  // =========================
  const guesthouse1 = await prisma.guesthouse.create({
    data: {
      name: "Bole Comfort Guesthouse",
      address: "Bole, Addis Ababa",
      city: "Addis Ababa",
      description:
        "A comfortable guesthouse located near Bole with clean rooms and modern facilities.",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      approved: true,
      ownerId: owner1.id,
    },
  });

  const guesthouse2 = await prisma.guesthouse.create({
    data: {
      name: "Addis Garden Guesthouse",
      address: "Kazanchis, Addis Ababa",
      city: "Addis Ababa",
      description:
        "A peaceful guesthouse offering comfortable accommodation in the heart of Addis Ababa.",
      image:
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
      approved: true,
      ownerId: owner1.id,
    },
  });

  const guesthouse3 = await prisma.guesthouse.create({
    data: {
      name: "Hawassa Lake View",
      address: "Hawassa, Sidama",
      city: "Hawassa",
      description:
        "A relaxing guesthouse close to Lake Hawassa with beautiful surroundings.",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
      approved: true,
      ownerId: owner2.id,
    },
  });

  const guesthouse4 = await prisma.guesthouse.create({
    data: {
      name: "Bahir Dar Lakeside Guesthouse",
      address: "Bahir Dar",
      city: "Bahir Dar",
      description:
        "A comfortable guesthouse close to Lake Tana and the city center.",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
      approved: true,
      ownerId: owner2.id,
    },
  });

  // =========================
  // ROOMS
  // =========================

  await prisma.room.createMany({
    data: [
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
    ],
  });

  console.log("✅ Demo owners created");
  console.log("✅ Demo guesthouses created");
  console.log("✅ Demo rooms created");
  console.log("🌱 Database seed completed!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });