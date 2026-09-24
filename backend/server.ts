import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { REACT_PORT, REACTURL } from "./config/env.js";
import { connectDB, db } from "./config/database.js";
import authRoutes from "./routes/v1/authRoute.js";
import bookRouter from "./routes/v1/bookingRoute.js";
import categoryRouter from "./routes/v1/categoryRoute.js";
import cityRouter from "./routes/v1/cityRoute.js";
import eventRouter from "./routes/v1/eventRoute.js";
import organiserRouter from "./routes/v1/organiserRoute.js";
import orgRequestRouter from "./routes/v1/organiserRequestRoute.js";
import ticketRouter from "./routes/v1/ticketRoute.js";
import userRouter from "./routes/v1/userRoutes.js"; 
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === REACTURL) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(cookieParser());

app.get("/", (_req, res) => {
    res.json({
        message: "CityPass API is running"
    });
});

app.get("/status", (_req, res) => {
  res.status(200).json({ status: "ok" });
});


app.get("/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");

    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/v1/auth", authRoutes);
app.use("/v1/bookings", bookRouter);
app.use("/v1/categories", categoryRouter);
app.use("/v1/cities", cityRouter);
app.use("/v1/events", eventRouter);
app.use("/v1/organisers", organiserRouter);
app.use("/v1/orgrequest", orgRequestRouter);
app.use("/v1/tickets", ticketRouter);
app.use("/v1/users", userRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(errorHandler);

const PORT = REACT_PORT || 5000;

async function startServer() {
  try {
    // Connect to DB first
    await connectDB();
    console.log("Database connected successfully");

    // Only run listener if DB succeeds
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // Prevent server from running if DB fails
    console.error("Database connection failed. Shutting down server:", error);
    console.log(error);
    process.exit(1);
  }
}

startServer();