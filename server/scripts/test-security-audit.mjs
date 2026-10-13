import "dotenv/config";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/hash.js";

const baseUrl = process.env.API_BASE_URL || "http://localhost:5000/api";
const suffix = Date.now();
const email = `security.audit.${suffix}@example.test`;
const password = "TemporaryAdminPass123!";
let testAdmin;
let originalSettings;
let settingsChanged = false;

const request = async (path, token, method = "GET", body) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
};

try {
  testAdmin = await prisma.user.create({
    data: {
      fullName: "Temporary Security Test Admin",
      email,
      password: await hashPassword(password),
      phone: `+2519${String(suffix).slice(-8)}`,
      role: "ADMIN",
    },
  });
  const adminToken = jwt.sign({ id: testAdmin.id, role: "ADMIN" }, process.env.JWT_SECRET);
  const guestToken = jwt.sign({ id: 999999, role: "GUEST" }, process.env.JWT_SECRET);

  const settingsResponse = await request("/admin/settings", adminToken);
  assert.equal(settingsResponse.status, 200, "admin can read settings");
  originalSettings = settingsResponse.body.data;

  const successfulLogin = await request("/auth/login", null, "POST", { email, password });
  const failedLogin = await request("/auth/login", null, "POST", { email, password: "WrongTemporaryPassword" });
  assert.equal(successfulLogin.status, 200, "successful login works normally");
  assert.equal(failedLogin.status, 401, "failed login is rejected");

  const search = new URLSearchParams({ search: email, page: "1", pageSize: "15" });
  const attempts = await request(`/admin/security/login-attempts?${search}`, adminToken);
  assert.equal(attempts.status, 200, "admin can read login attempts");
  assert.equal(attempts.body.data.total, 2, "both login outcomes are recorded");
  assert.equal(attempts.body.data.items[0].failedCount, 1, "failed attempt count is calculated");

  for (let index = 0; index < 8; index += 1) {
    await request("/auth/login", null, "POST", { email, password: "WrongTemporaryPassword" });
  }
  const rateLimited = await request("/auth/login", null, "POST", { email, password: "WrongTemporaryPassword" });
  assert.equal(rateLimited.status, 429, "login is rate-limited after ten attempts");

  let commissionRate = originalSettings.commissionRate + 1;
  if (commissionRate > 100) commissionRate = originalSettings.commissionRate - 1;
  const updatedSettings = await request("/admin/settings", adminToken, "PUT", {
    ...originalSettings,
    ownerRegistrationEnabled: false,
    guestBookingEnabled: false,
    commissionRate,
    password,
  });
  assert.equal(updatedSettings.status, 200, "correct password allows a sensitive change");
  settingsChanged = true;

  const audit = await request(`/admin/security/audit-logs?${search}`, adminToken);
  assert.equal(audit.status, 200, "admin can read audit logs");
  const expectedAuditEntries = Number(originalSettings.ownerRegistrationEnabled)
    + Number(originalSettings.guestBookingEnabled)
    + Number(originalSettings.commissionRate !== commissionRate);
  assert.equal(audit.body.data.total, expectedAuditEntries, "each changed setting receives an audit entry");

  const reenabledSettings = await request("/admin/settings", adminToken, "PUT", {
    ...updatedSettings.body.data,
    ownerRegistrationEnabled: true,
    guestBookingEnabled: true,
  });
  assert.equal(reenabledSettings.status, 200, "enabling availability does not require password reconfirmation");

  const wrongPassword = await request("/admin/settings", adminToken, "PUT", {
    ...updatedSettings.body.data,
    commissionRate: commissionRate === 100 ? 99 : commissionRate + 1,
    password: "WrongTemporaryPassword",
  });
  assert.equal(wrongPassword.status, 401, "incorrect password is rejected");

  const guestAccess = await request("/admin/security/audit-logs", guestToken);
  assert.equal(guestAccess.status, 403, "non-admin access is rejected");
  const invalidPage = await request("/admin/security/login-attempts?page=0", adminToken);
  assert.equal(invalidPage.status, 400, "invalid pagination is rejected");

  console.log("Security audit smoke test passed.");
} finally {
  if (testAdmin) {
    if (settingsChanged && originalSettings) {
      const adminToken = jwt.sign({ id: testAdmin.id, role: "ADMIN" }, process.env.JWT_SECRET);
      const restored = await request("/admin/settings", adminToken, "PUT", {
        ...originalSettings,
        password,
      });
      assert.equal(restored.status, 200, "original platform settings are restored");
    }
    await prisma.auditLog.deleteMany({ where: { actorId: testAdmin.id } });
    await prisma.loginAttempt.deleteMany({ where: { email } });
    await prisma.user.delete({ where: { id: testAdmin.id } });
  }
  await prisma.$disconnect();
}