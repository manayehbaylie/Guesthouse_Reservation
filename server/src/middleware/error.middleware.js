export const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.error(err);

  const message = err.message || "Something went wrong";
  const isDbConnectionError =
    message.includes("Authentication failed against database server") ||
    message.includes("Can't reach database server") ||
    message.includes("P1001") ||
    message.includes("P1000");

  if (isDbConnectionError) {
    return res.status(503).json({
      success: false,
      message:
        "Database connection failed. Check DATABASE_URL in server/.env and ensure PostgreSQL is running.",
    });
  }

  res.status(500).json({
    success: false,
    message,
  });
};