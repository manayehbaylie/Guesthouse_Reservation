import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGuesthouseSearchWhere,
  buildSearchRoomWhere,
  calculateDistanceKm,
  rankNearbyGuesthouses,
  validateNearbySearchQuery,
} from "./search.service.js";
import { parseOptionalCoordinates } from "../utils/geo.utils.js";

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

test("guesthouse search trims location and name terms and remains case-insensitive", () => {
  const where = buildGuesthouseSearchWhere({
    city: "  AdDiS AbAbA  ",
    name: "  Blue Nile  ",
  });

  assert.equal(where.name.contains, "Blue Nile");
  assert.equal(where.name.mode, "insensitive");
  assert.ok(where.OR.every((condition) =>
    Object.values(condition)[0].contains === "AdDiS AbAbA" &&
    Object.values(condition)[0].mode === "insensitive"
  ));
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

test("nearby distance uses great-circle kilometers", () => {
  const distance = calculateDistanceKm(
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 }
  );

  assert.ok(Math.abs(distance - 111.195) < 0.01);
});

test("guesthouse coordinates must be a valid latitude/longitude pair", () => {
  assert.deepEqual(
    parseOptionalCoordinates({ latitude: "9.03", longitude: "38.74" }),
    { latitude: 9.03, longitude: 38.74 }
  );
  assert.throws(
    () => parseOptionalCoordinates({ latitude: "9.03" }),
    (error) => error.statusCode === 400 && /provided together/.test(error.message)
  );
  assert.throws(
    () =>
      parseOptionalCoordinates({
        latitude: "9.03",
        longitude: "181",
      }),
    (error) => error.statusCode === 400
  );
});

test("nearby search requires GPS or a place and accepts only supported radii", () => {
  assert.equal(
    validateNearbySearchQuery({ latitude: "9.03", longitude: "38.74" }).radiusKm,
    5
  );
  assert.equal(
    validateNearbySearchQuery({ place: "Hawassa" }).place,
    "Hawassa"
  );
  assert.throws(
    () => validateNearbySearchQuery({}),
    (error) => error.statusCode === 400 && /GPS coordinates/.test(error.message)
  );
  assert.throws(
    () =>
      validateNearbySearchQuery({
        latitude: "91",
        longitude: "38",
      }),
    (error) => error.statusCode === 400
  );
  assert.throws(
    () =>
      validateNearbySearchQuery({
        place: "Hawassa",
        radiusKm: "2",
      }),
    (error) => error.statusCode === 400 && /Radius/.test(error.message)
  );
});

test("nearby guesthouses are radius-filtered and sorted by actual distance", () => {
  const criteria = validateNearbySearchQuery({
    latitude: "0",
    longitude: "0",
    radiusKm: "5",
  });
  const results = rankNearbyGuesthouses(
    [
      { id: 3, latitude: 0.06, longitude: 0 },
      { id: 2, latitude: 0.01, longitude: 0 },
      { id: 1, latitude: 0.005, longitude: 0 },
    ],
    criteria
  );

  assert.deepEqual(results.map((guesthouse) => guesthouse.id), [1, 2]);
  assert.ok(results[0].distanceKm < results[1].distanceKm);
});
