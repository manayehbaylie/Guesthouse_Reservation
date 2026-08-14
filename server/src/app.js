import express from "express";
import cors from "cors";
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
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";
import ownerRoutes from "./routes/owner.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import guestRoutes from "./routes/guest.routes.js";

const app = express();

// Read JSON requests
app.use(express.json());
// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
}));
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
 app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec));
 app.use("/api/owner", ownerRoutes);
 app.use("/api/admin", adminRoutes);
 app.use("/api/guest", guestRoutes);
// Error Handler (Always last)
app.use(errorHandler);

export default app;