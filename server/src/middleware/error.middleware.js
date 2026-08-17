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

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
  return res.status(400).json({
    success: false,
    message: err.issues?.[0]?.message || 'Validation error',
    errors: err.issues || [],
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
    return res.status(400).json({
      success: false,
      message: 'A record with this information already exists',
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
  });
};