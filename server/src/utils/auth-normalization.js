export const normalizeEthiopianPhone = (input) => {
  const value = String(input || "").trim().replace(/[\s\-()]/g, "");

  if (/^09\d{8}$/.test(value)) return `+251${value.slice(1)}`;
  if (/^9\d{8}$/.test(value)) return `+251${value}`;
  if (/^2519\d{8}$/.test(value)) return `+${value}`;
  if (/^\+2519\d{8}$/.test(value)) return value;
  return null;
};

export const validateGmailAddress = (input) => {
  const value = String(input || "");
  if (value !== value.trim() || /\s/.test(value)) return false;

  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  const [mailbox, tag, ...extra] = local.split("+");
  return (
    extra.length === 0 &&
    /^(?=.{6,30}$)[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/.test(mailbox) &&
    (tag === undefined || /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/.test(tag)) &&
    /^(gmail\.com|googlemail\.com)$/i.test(domain)
  );
};

export const normalizeGmailAddress = (input) => {
  if (!validateGmailAddress(input)) return null;

  const [local, domain] = String(input).toLowerCase().split("@");
  const mailbox = local.split("+")[0].replaceAll(".", "");
  return `${mailbox}@gmail.com`;
};

export const getEthiopianPhoneLookupCandidates = (input) => {
  const normalized = normalizeEthiopianPhone(input);
  if (!normalized) return [];
  const national = normalized.slice(4);
  return [normalized, `0${national}`, national, `251${national}`];
};