import sendEmail, { buildResetCodeEmail } from "../utils/sendEmail.js";

const hasValue = (key) => Boolean(process.env[key]?.trim());

// Production (Render) needs Brevo; localhost can use Brevo or Gmail SMTP.
export const isPasswordResetEmailConfigured = () => {
  const hasSender = hasValue("AUTH_EMAIL_FROM");
  const hasBrevo = hasValue("BREVO_API_KEY");
  const hasSmtp = hasValue("SMTP_HOST") && hasValue("SMTP_USER") && hasValue("SMTP_PASS");

  if (!hasSender) return false;
  if (process.env.NODE_ENV === "production") return hasBrevo;
  return hasBrevo || hasSmtp;
};

export const sendPasswordResetEmail = async (email, code) => {
  if (!isPasswordResetEmailConfigured()) {
    const error = new Error(
      "Email code delivery is not configured. Set AUTH_EMAIL_FROM and either BREVO_API_KEY or SMTP_HOST, SMTP_USER, SMTP_PASS in server/.env."
    );
    error.statusCode = 503;
    throw error;
  }

  const { html } = buildResetCodeEmail(code, 10);

  try {
    await sendEmail({
      to: email,
      subject: "Your Guesthouse Reservation password reset code",
      html,
    });
  } catch {
    console.error("Password reset email failed.");
    const error = new Error(
      "The reset email could not be sent. Please try again in a moment."
    );
    error.statusCode = 502;
    throw error;
  }
};