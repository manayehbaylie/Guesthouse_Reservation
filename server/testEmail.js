import "dotenv/config";
import sendEmail, { buildResetCodeEmail } from "./src/utils/sendEmail.js";

const { subject, html } = buildResetCodeEmail("123456", 10);

sendEmail({
  to: "manayehbaylie@gmail.com",
  subject,
  html,
})
  .then(() => console.log("SENT"))
  .catch((e) => console.error("FAILED:", e.message));