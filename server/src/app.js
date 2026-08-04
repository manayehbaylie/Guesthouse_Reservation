import express from "express";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import guesthouseRoutes from "./routes/guesthouse.routes.js";
import roomRoutes from "./routes/room.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
const app = express();

// Read JSON requests
app.use(express.json());

// Authentication Routes
app.use("/api/auth", authRoutes);

app.use("/api/guesthouses", guesthouseRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
// Error Handler (Always last)
app.use(errorHandler);

export default app;