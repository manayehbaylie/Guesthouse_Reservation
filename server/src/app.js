import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import guesthouseRoutes from "./routes/guesthouse.routes.js";
import roomRoutes from "./routes/room.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";
import searchRoutes from "./routes/search.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import receptionistRoutes from "./routes/receptionist.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";
import ownerRoutes from "./routes/owner.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import guestRoutes from "./routes/guest.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import telegramRoutes from "./routes/telegram.routes.js";
import communicationRoutes from "./routes/communication.routes.js";
import systemRoutes from "./routes/system.routes.js";
import { enforceSystemLock } from "./middleware/system-lock.middleware.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const frontendOrigin = new URL(process.env.FRONTEND_URL || "http://localhost:5175").origin;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "../uploads")));

// Read JSON requests
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buffer) => {
    if (req.originalUrl?.startsWith("/api/payments/chapa/webhook")) {
      req.rawBody = Buffer.from(buffer);
    }
  },
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === frontendOrigin) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use("/api", enforceSystemLock);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Authentication Routes
app.use("/api/auth", authRoutes);

app.use("/api/guesthouses", guesthouseRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
 app.use("/api/search",searchRoutes);
 app.use("/api/notifications",notificationRoutes);
 app.use("/api/receptionist",receptionistRoutes);
 app.use("/api/analytics", analyticsRoutes);
 app.use("/api/reviews", reviewRoutes);
 app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec));
 app.use("/api/owner", ownerRoutes);
 app.use("/api/admin", adminRoutes);
 app.use("/api/guest", guestRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/system", systemRoutes);
// Error Handler (Always last)
app.use(errorHandler);

export default app;