import express from "express";

import {
  getBookings,
  addBooking,
  cancelBooking,
} from "../../controllers/bookingController.js";

import { authenticate } from "../../middleware/authMiddleware.js";
import { validateIdParam } from "../../validators/idValidator.js";

const bookRouter = express.Router();


// Only logged-in user can view their bookings
bookRouter.get("/", authenticate, getBookings);


// Only logged-in user can create booking
bookRouter.post("/", authenticate, addBooking);


// Only logged-in user can cancel their own booking
bookRouter.patch(
  "/:id/cancel",
  validateIdParam,
  authenticate,
  cancelBooking
);

export default bookRouter;