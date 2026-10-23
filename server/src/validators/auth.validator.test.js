import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "./auth.validator.js";

const baseRegistration = {
  fullName: "Guest Example",
  phone: "+251911111111",
  password: "password1",
  confirmPassword: "password1",
  role: "GUEST",
  agreedToTerms: true,
};

test("register schema accepts guest registration with website consent and optional email", () => {
  const result = registerSchema.parse(baseRegistration);
  assert.equal(result.role, "GUEST");
  assert.equal(result.email, undefined);
  assert.equal(result.agreedToTerms, true);
});

test("register schema requires owner address and ID fields and accepts only shared ID types", () => {
  const missingOwnerFields = registerSchema.safeParse({ ...baseRegistration, role: "OWNER", email: "owner@gmail.com" });
  assert.equal(missingOwnerFields.success, false);
  assert.deepEqual(
    missingOwnerFields.error.issues.map(({ path }) => path[0]).sort(),
    ["idNumber", "idType", "residentialAddress"]
  );

  const validOwner = registerSchema.parse({
    ...baseRegistration,
    role: "OWNER",
    email: "owner@gmail.com",
    residentialAddress: "12 Example Street",
    idType: "Passport",
    idNumber: "A1234",
  });
  assert.equal(validOwner.idType, "Passport");

  const invalidIdType = registerSchema.safeParse({
    ...validOwner,
    idType: "Other",
  });
  assert.equal(invalidIdType.success, false);
  assert.equal(invalidIdType.error.issues[0].message, "Please select your ID type.");
});

test("register schema rejects absent policy consent and mismatched confirmation", () => {
  const noConsent = registerSchema.safeParse({ ...baseRegistration, agreedToTerms: false });
  assert.equal(noConsent.success, false);
  assert.ok(noConsent.error.issues.some(({ message }) => message === "Please agree to the Terms of Service and Privacy Policy."));

  const mismatchedPassword = registerSchema.safeParse({ ...baseRegistration, confirmPassword: "different1" });
  assert.equal(mismatchedPassword.success, false);
  assert.ok(mismatchedPassword.error.issues.some(({ message }) => message === "Passwords do not match."));
});
