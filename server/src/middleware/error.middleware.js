export const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.error("API request failed:", err?.name || "Error", err?.code || "");

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

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
  const errors = Object.fromEntries((err.issues || []).map((issue) => [issue.path?.[0] || 'form', issue.message]));
  return res.status(400).json({
    success: false,
    message: err.issues?.[0]?.message || 'Validation error',
    errors,
  });
}
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target)
      ? err.meta.target
      : [];
    const message = fields.includes('phone') || fields.includes('normalizedPhone')
      ? 'This phone number is already registered.'
      : fields.includes('email') || fields.includes('normalizedEmail')
        ? 'This email is already registered.'
        : 'A record with this information already exists';

    return res.status(409).json({
      success: false,
      field: fields.includes('phone') || fields.includes('normalizedPhone') ? 'phone' : 'email',
      message,
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    ...(err.code === "SYSTEM_LOCKED" ? {
      code: "SYSTEM_LOCKED",
      systemLocked: true,
      lockMessage: err.systemLockMessage || "",
    } : {}),
    ...(err.field ? { field: err.field } : {}),
    message: err.message || 'Something went wrong',
  });
};