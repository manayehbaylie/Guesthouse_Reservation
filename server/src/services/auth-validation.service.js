import { normalizeGmailAddress, normalizeEthiopianPhone, validateGmailAddress } from "../utils/auth-normalization.js";
import { REGISTRATION_ID_TYPES } from "../../../shared/registration-options.mjs";

const disposableDomains = new Set(
  String(process.env.DISPOSABLE_EMAIL_DOMAINS || "mailinator.com,tempmail.com,10minutemail.com,guerrillamail.com")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
);

export const validateRegistrationEmail = async (email, role) => {
  const value = typeof email === "string" ? email : "";
  if (!value) {
    if (role === "OWNER") {
      const error = new Error("Email is required for owner accounts.");
      error.statusCode = 400;
      error.field = "email";
      throw error;
    }
    return { email: null, normalizedEmail: null };
  }

  if (!validateGmailAddress(value)) {
    const error = new Error("Please enter a valid Gmail address.");
    error.statusCode = 400;
    error.field = "email";
    throw error;
  }

  const domain = value.split("@")[1].toLowerCase();
  if (disposableDomains.has(domain)) {
    const error = new Error("Temporary email addresses are not allowed.");
    error.statusCode = 400;
    error.field = "email";
    throw error;
  }

  return { email: value.toLowerCase(), normalizedEmail: normalizeGmailAddress(value) };
};

export const normalizeRegistrationPhone = (phone) => {
  const normalizedPhone = normalizeEthiopianPhone(phone);
  if (!normalizedPhone) {
    const error = new Error("Please enter a valid Ethiopian phone number.");
    error.statusCode = 400;
    error.field = "phone";
    throw error;
  }
  return normalizedPhone;
};

export const validateRegistrationName = (value) => {
  const fullName = String(value || "").trim();
  if (fullName.length < 3) throw Object.assign(new Error("Full name must be at least 3 characters."), { field: "fullName" });
  if (fullName.length > 120) throw Object.assign(new Error("Full name is too long."), { field: "fullName" });
  return fullName;
};

export const validateRegistrationAddress = (value) => {
  const address = String(value || "").trim();
  if (!address) throw Object.assign(new Error("Residential address is required for owner accounts."), { field: "residentialAddress" });
  if (address.length > 300) throw Object.assign(new Error("Residential address is too long."), { field: "residentialAddress" });
  return address;
};

export const validateRegistrationIdType = (value) => {
  const idType = String(value || "").trim();
  if (!REGISTRATION_ID_TYPES.includes(idType)) {
    throw Object.assign(new Error("Please select your ID type."), { field: "idType" });
  }
  return idType;
};

export const validateRegistrationIdNumber = (value) => {
  const idNumber = String(value || "").trim();
  if (!idNumber) throw Object.assign(new Error("ID number is required for owner accounts."), { field: "idNumber" });
  if (idNumber.length > 120) throw Object.assign(new Error("ID number is too long."), { field: "idNumber" });
  return idNumber;
};

export const validateRegistrationPassword = (value) => {
  if (typeof value !== "string" || value.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters."), { field: "password" });
  }
  if (value.length > 128) throw Object.assign(new Error("Password is too long."), { field: "password" });
  return value;
};

export const validateRegistrationPasswordConfirmation = (password, confirmation) => {
  if (typeof confirmation !== "string" || confirmation.length > 128) {
    throw Object.assign(new Error("Password is too long."), { field: "confirmPassword" });
  }
  if (password !== confirmation) throw Object.assign(new Error("Passwords do not match."), { field: "confirmPassword" });
  return confirmation;
};

export const validateRegistrationConsent = (consent) => {
  if (consent !== true) {
    throw Object.assign(new Error("Please agree to the Terms of Service and Privacy Policy."), { field: "agreedToTerms" });
  }
  return true;
};