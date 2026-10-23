import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeEthiopianPhone,
  getEthiopianPhoneLookupCandidates,
  normalizeGmailAddress,
  validateGmailAddress,
} from "./auth-normalization.js";

test("normalizes Gmail aliases to one mailbox", () => {
  assert.equal(normalizeGmailAddress("First.Last+booking@googlemail.com"), "firstlast@gmail.com");
  assert.equal(normalizeGmailAddress("firstlast@gmail.com"), "firstlast@gmail.com");
});

test("accepts only valid Gmail local parts", () => {
  for (const email of ["short@gmail.com", ".firstly@gmail.com", "firstly.@gmail.com", "first..last@gmail.com", "first name@gmail.com", "firstly@example.com"]) {
    assert.equal(validateGmailAddress(email), false, email);
  }

  assert.equal(validateGmailAddress("first.last@gmail.com"), true);
});

test("normalizes supported Ethiopian phone formats to E.164", () => {
  for (const phone of ["0912345678", "912345678", "251912345678", "+251 91 234 5678"]) {
    assert.equal(normalizeEthiopianPhone(phone), "+251912345678");
  }

  assert.equal(normalizeEthiopianPhone("+251712345678"), null);
  assert.deepEqual(getEthiopianPhoneLookupCandidates("0912345678"), [
    "+251912345678",
    "0912345678",
    "912345678",
    "251912345678",
  ]);
});