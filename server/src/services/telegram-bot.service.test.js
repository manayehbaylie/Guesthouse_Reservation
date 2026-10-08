import test from "node:test";
import assert from "node:assert/strict";
import {
  formatTelegramSearchResults,
  parseTelegramSearch,
} from "./telegram-bot.service.js";

test("search parser accepts arbitrary Ethiopian locations, room type, price, and dates", () => {
  const params = parseTelegramSearch(
    "/search in Gambella FAMILY under 2,500 2026-11-10 2026-11-12"
  );

  assert.equal(params.get("location"), "Gambella");
  assert.equal(params.get("roomType"), "FAMILY");
  assert.equal(params.get("maxPrice"), "2500");
  assert.equal(params.get("checkIn"), "2026-11-10");
  assert.equal(params.get("checkOut"), "2026-11-12");
});

test("search parser accepts non-Latin location names", () => {
  const params = parseTelegramSearch("/search ጎንደር");
  assert.equal(params.get("location"), "ጎንደር");
});

test("search formatter includes guesthouse, location, room, rate, and availability", () => {
  const message = formatTelegramSearchResults(
    [{
      name: "Blue Nile Guesthouse",
      city: "Bahir Dar",
      subCity: "Kebele 03",
      rooms: [{ roomType: "DOUBLE", price: 1500 }],
    }],
    new URLSearchParams()
  );

  assert.match(message, /Blue Nile Guesthouse/);
  assert.match(message, /Kebele 03, Bahir Dar/);
  assert.match(message, /DOUBLE/);
  assert.match(message, /1,500 ETB\/night/);
  assert.match(message, /Available/);
});
