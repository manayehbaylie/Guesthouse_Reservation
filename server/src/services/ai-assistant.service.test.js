import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssistantRoomWhere,
  buildAssistantSearchWhere,
  buildDatabaseReply,
  buildReservationAccessWhere,
  detectReplyLanguage,
  parseSearchCriteria,
} from "./ai-assistant.service.js";

test("parses room type, guest count, affordability, and location", () => {
  const criteria = parseSearchCriteria("Find a cheap double room for 2 people in Addis Ababa");

  assert.equal(criteria.roomType, "DOUBLE");
  assert.equal(criteria.minCapacity, 2);
  assert.equal(criteria.sortByPrice, true);
  assert.equal(criteria.location, "Addis Ababa");
});

test("parses a maximum price and excludes rooms above it", () => {
  const criteria = parseSearchCriteria("Show rooms under ETB 1,500");
  const where = buildAssistantSearchWhere(criteria);

  assert.equal(criteria.maxPrice, 1500);
  assert.equal(where.status, "APPROVED");
  assert.deepEqual(where.rooms.some, {
    available: true,
    maintenanceStatus: "AVAILABLE",
    price: { lte: 1500 },
  });
});

test("booking context is restricted to the signed-in user's role scope", () => {
  assert.deepEqual(buildReservationAccessWhere({ id: 3, role: "GUEST" }), {
    guestId: 3,
  });
  assert.deepEqual(buildReservationAccessWhere({ id: 4, role: "OWNER" }), {
    room: { guesthouse: { ownerId: 4 } },
  });
  assert.deepEqual(buildReservationAccessWhere({ id: 5, role: "RECEPTIONIST" }), {
    room: { guesthouse: { staffAssignments: { some: { staffId: 5 } } } },
  });
  assert.deepEqual(buildReservationAccessWhere({ id: 1, role: "ADMIN" }), {});
  assert.equal(buildReservationAccessWhere({ id: 6, role: "UNKNOWN" }), null);
});

test("requested dates exclude rooms with overlapping confirmed paid bookings", () => {
  const criteria = {
    dateRange: {
      checkIn: new Date("2026-11-10T00:00:00.000Z"),
      checkOut: new Date("2026-11-12T00:00:00.000Z"),
    },
  };
  const roomWhere = buildAssistantRoomWhere(criteria);

  assert.equal(roomWhere.available, true);
  assert.equal(roomWhere.maintenanceStatus, "AVAILABLE");
  assert.deepEqual(roomWhere.reservations.none.checkIn, {
    lt: criteria.dateRange.checkOut,
  });
  assert.deepEqual(roomWhere.reservations.none.checkOut, {
    gt: criteria.dateRange.checkIn,
  });
});

test("parses location phrases using from and near", () => {
  assert.equal(
    parseSearchCriteria("Please give the best room from Gonder").location,
    "Gonder"
  );
  assert.equal(parseSearchCriteria("Find a room near Hawassa").location, "Hawassa");
});

test("database fallback answers with available recommendations", () => {
  const reply = buildDatabaseReply({
    message: "please give best room from gonder",
    recommendations: [
      { rooms: [{ price: 2000 }], name: "Test Guesthouse" },
    ],
    bookings: [],
  });

  assert.match(reply, /1 available room across 1 approved guesthouse/);
});

test("Amharic room search is recognized as a database search", () => {
  const reply = buildDatabaseReply({
    message: "ለ2 ሰዎች ርካሽ ድርብ ክፍል በጎንደር ፈልግ",
    recommendations: [{ rooms: [{}, {}] }],
    bookings: [],
    language: "am",
  });

  assert.match(reply, /2 የሚገኙ ክፍሎች/);
});

test("database fallback does not invent reservations or availability", () => {
  const searchReply = buildDatabaseReply({
    message: "Find a room in an unknown city",
    recommendations: [],
    bookings: [],
  });
  const bookingReply = buildDatabaseReply({
    message: "Show my bookings",
    recommendations: [],
    bookings: [],
  });

  assert.match(searchReply, /couldn't find an approved guesthouse/);
  assert.match(bookingReply, /couldn't find bookings in the records available/);
});

test("detects Amharic and Afaan Oromo and respects the selected language", () => {
  assert.equal(detectReplyLanguage("በጎንደር ውስጥ ክፍል ፈልግ", "en"), "am");
  assert.equal(detectReplyLanguage("Mana keessummaa Gonder keessatti naaf barbaadi", "en"), "om");
  assert.equal(detectReplyLanguage("Find a room in Gonder", "om"), "om");
  assert.equal(detectReplyLanguage("Find a room in Gonder", "en"), "en");
});

test("database fallback provides replies in Amharic and Afaan Oromo", () => {
  const message = "Find a room in a city with no results";
  const base = { message, recommendations: [], bookings: [] };

  assert.match(buildDatabaseReply({ ...base, language: "am" }), /አላገኘሁም/);
  assert.match(buildDatabaseReply({ ...base, language: "om" }), /hin arganne/);
});

test("parses room searches in Amharic and Afaan Oromo", () => {
  const amharic = parseSearchCriteria("ለ2 ሰዎች ርካሽ ድርብ ክፍል በጎንደር ፈልግ");
  const afaanOromo = parseSearchCriteria("Gonder keessatti kutaa nama lamaa gatii salphaa naaf barbaadi");

  assert.equal(amharic.roomType, "DOUBLE");
  assert.equal(amharic.minCapacity, 2);
  assert.equal(amharic.location, "Gonder");
  assert.equal(afaanOromo.roomType, "DOUBLE");
  assert.equal(afaanOromo.minCapacity, 2);
  assert.equal(afaanOromo.location, "Gonder");
});