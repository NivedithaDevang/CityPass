import path from "path";
import express, { Router } from "express";
import authRoutes from "./authRoute.js";
import bookRouter from "./bookingRoute.js";
import categoryRouter from "./categoryRoute.js";
import cityRouter from "./cityRoute.js";
import eventRouter from "./eventRoute.js";
import organiserRouter from "./organiserRoute.js";
import orgRequestRouter from "./organiserRequestRoute.js";
import ticketRouter from "./ticketRoute.js";
import userRouter from "./userRoutes.js";
import errorHandler from "../../middleware/errorHandler.js";

const router: Router = express.Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/bookings", bookRouter);
router.use("/v1/categories", categoryRouter);
router.use("/v1/cities", cityRouter);
router.use("/v1/events", eventRouter);
router.use("/v1/organisers", organiserRouter);
router.use("/v1/orgrequest", orgRequestRouter);
router.use("/v1/tickets", ticketRouter);
router.use("/v1/users", userRouter);
router.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

router.use(errorHandler);

export default router;