import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting safe database seed...");

  // =========================
  // PASSWORD
  // =========================
  const password = await bcrypt.hash("Password123", 10);

  // =========================
  // ADMIN
  // =========================
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
      phone: "+251911111113",
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
  // RECEPTIONIST & GUEST
  // =========================
  const receptionist1 = await prisma.user.upsert({
    where: {
      email: "receptionist1@example.com",
    },
    update: {},
    create: {
      fullName: "Tigist Alemu Receptionist",
      email: "receptionist1@example.com",
      password,
      phone: "+251911111114",
      role: "RECEPTIONIST",
    },
  });

  const guest1 = await prisma.user.upsert({
    where: {
      email: "guest1@example.com",
    },
    update: {},
    create: {
      fullName: "Abebe Bikila Guest",
      email: "guest1@example.com",
      password,
      phone: "+251911111115",
      role: "GUEST",
    },
  });

  // =========================
  // GUESTHOUSES
  // =========================
  let guesthouse1 = await prisma.guesthouse.findFirst({
    where: { name: "Bole Comfort Guesthouse" },
  });
  if (!guesthouse1) {
    guesthouse1 = await prisma.guesthouse.create({
      data: {
        name: "Bole Comfort Guesthouse",
        address: "Bole, Addis Ababa",
        city: "Addis Ababa",
        description:
          "A comfortable guesthouse located near Bole with clean rooms and modern facilities.",
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        status: "APPROVED",
        ownerId: owner1.id,
      },
    });
  }

  let guesthouse2 = await prisma.guesthouse.findFirst({
    where: { name: "Addis Garden Guesthouse" },
  });
  if (!guesthouse2) {
    guesthouse2 = await prisma.guesthouse.create({
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
  }

  let guesthouse3 = await prisma.guesthouse.findFirst({
    where: { name: "Hawassa Lake View" },
  });
  if (!guesthouse3) {
    guesthouse3 = await prisma.guesthouse.create({
      data: {
        name: "Hawassa Lake View",
        address: "Hawassa, Sidama",
        city: "Hawassa",
        description:
          "A relaxing guesthouse close to Lake Hawassa with beautiful surroundings.",
        image:
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        status: "APPROVED",
        ownerId: owner2.id,
      },
    });
  }

  let guesthouse4 = await prisma.guesthouse.findFirst({
    where: { name: "Bahir Dar Lakeside Guesthouse" },
  });
  if (!guesthouse4) {
    guesthouse4 = await prisma.guesthouse.create({
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
  }

  // =========================
  // STAFF ASSIGNMENTS
  // =========================
  await prisma.staffAssignment.upsert({
    where: {
      guesthouseId_staffId: {
        guesthouseId: guesthouse1.id,
        staffId: receptionist1.id,
      },
    },
    update: {},
    create: {
      guesthouseId: guesthouse1.id,
      staffId: receptionist1.id,
    },
  });

  // =========================
  // ROOMS
  // =========================
  const roomsData = [
    { roomNumber: "101", roomType: "SINGLE", price: 1200, capacity: 1, available: true, guesthouseId: guesthouse1.id },
    { roomNumber: "102", roomType: "DOUBLE", price: 2000, capacity: 2, available: true, guesthouseId: guesthouse1.id },
    { roomNumber: "103", roomType: "SUITE", price: 3500, capacity: 3, available: true, guesthouseId: guesthouse1.id },
    { roomNumber: "201", roomType: "SINGLE", price: 1300, capacity: 1, available: true, guesthouseId: guesthouse2.id },
    { roomNumber: "202", roomType: "DOUBLE", price: 2200, capacity: 2, available: true, guesthouseId: guesthouse2.id },
    { roomNumber: "203", roomType: "FAMILY", price: 3200, capacity: 4, available: true, guesthouseId: guesthouse2.id },
    { roomNumber: "301", roomType: "SINGLE", price: 1000, capacity: 1, available: true, guesthouseId: guesthouse3.id },
    { roomNumber: "302", roomType: "DOUBLE", price: 1800, capacity: 2, available: true, guesthouseId: guesthouse3.id },
    { roomNumber: "303", roomType: "SUITE", price: 3000, capacity: 3, available: true, guesthouseId: guesthouse3.id },
    { roomNumber: "401", roomType: "SINGLE", price: 1100, capacity: 1, available: true, guesthouseId: guesthouse4.id },
    { roomNumber: "402", roomType: "TWIN", price: 1900, capacity: 2, available: true, guesthouseId: guesthouse4.id },
    { roomNumber: "403", roomType: "FAMILY", price: 2800, capacity: 4, available: true, guesthouseId: guesthouse4.id },
  ];

  for (const r of roomsData) {
    await prisma.room.upsert({
      where: {
        guesthouseId_roomNumber: {
          guesthouseId: r.guesthouseId,
          roomNumber: r.roomNumber,
        },
      },
      update: {
        roomType: r.roomType,
        price: r.price,
        capacity: r.capacity,
        available: r.available,
      },
      create: r,
    });
  }

  console.log("✅ Demo users created (Admin, Owners, Receptionist, Guest)");
  console.log("✅ Demo guesthouses created/verified");
  console.log("✅ Staff assignment created");
  console.log("✅ Demo rooms created/verified");
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