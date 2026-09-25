import express, { Application, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { db } from "./config/database.js";
import { REACTURL } from "./config/env.js";
import routes from "./routes/v1/index.js";

const app: Application = express();

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allows requests without origin (e.g., Postman/mobile apps) or matching frontend URL
    if (!origin || origin === REACTURL) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Base endpoints
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "CityPass API is running" });
});

app.get("/status", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/health", async (_req: Request, res: Response) => {
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

// API routes
app.use(routes);

export default app;