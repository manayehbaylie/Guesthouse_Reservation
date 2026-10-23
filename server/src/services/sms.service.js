export const isPasswordResetSmsConfigured = () =>
  Boolean(process.env.AT_USERNAME?.trim() && process.env.AT_API_KEY?.trim());

export const sendPasswordResetSms = async (phone, code) => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[auth-dev] Password reset code issued for ${phone}: ${code}`);
    return;
  }

  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  const senderId = process.env.AT_SENDER_ID;
  if (!isPasswordResetSmsConfigured()) {
    const error = new Error("SMS code delivery is not configured. Set AT_USERNAME and AT_API_KEY in server/.env.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username,
      to: phone,
      message: `Your Guesthouse Reservation password reset code is ${code}. It expires in 10 minutes.`,
      ...(senderId ? { from: senderId } : {}),
    }),
  });

  if (!response.ok) {
    const error = new Error("The reset SMS could not be sent. Check the Africa's Talking configuration and try again.");
    error.statusCode = 502;
    throw error;
  }
};