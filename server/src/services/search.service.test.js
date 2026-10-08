import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGuesthouseSearchWhere,
  buildSearchRoomWhere,
} from "./search.service.js";

test("guesthouse search covers city, address, sub-city, and woreda without a city allowlist", () => {
  const where = buildGuesthouseSearchWhere({ location: "Gambella" });

  assert.equal(where.status, "APPROVED");
  assert.deepEqual(where.OR.map((condition) => Object.keys(condition)[0]), [
    "city",
    "address",
    "subCity",
    "woreda",
    "name",
  ]);
  assert.equal(where.rooms.some.available, true);
  assert.equal(where.rooms.some.maintenanceStatus, "AVAILABLE");
});

test("date filters exclude overlapping paid confirmations and check-ins", () => {
  const where = buildSearchRoomWhere({
    checkIn: "2026-11-10",
    checkOut: "2026-11-12",
  });

  assert.deepEqual(where.reservations.none.checkIn, {
    lt: new Date("2026-11-12T00:00:00.000Z"),
  });
  assert.deepEqual(where.reservations.none.checkOut, {
    gt: new Date("2026-11-10T00:00:00.000Z"),
  });
});

test("date filters require a valid, complete increasing range", () => {
  assert.throws(
    () => buildSearchRoomWhere({ checkIn: "2026-11-10" }),
    (error) => error.statusCode === 400 && /Both check-in/.test(error.message)
  );
  assert.throws(
    () => buildSearchRoomWhere({ checkIn: "2026-11-12", checkOut: "2026-11-10" }),
    (error) => error.statusCode === 400 && /Check-out date/.test(error.message)
  );
});
