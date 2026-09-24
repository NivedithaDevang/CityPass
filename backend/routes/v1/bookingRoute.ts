import express from "express";
import {
    getBookings,
    addBooking,
    cancelBooking
} from "../../controllers/bookingController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const bookRouter = express.Router();

bookRouter.get("/", getBookings);

bookRouter.post("/", authenticate, addBooking);

bookRouter.patch("/:id/cancel", authenticate, cancelBooking);

export default bookRouter; 