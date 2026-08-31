import express from "express";
import {
    getBookings,
    addBooking
} from "../../controllers/bookingController.js";
const bookRouter = express.Router();

bookRouter.get("/", getBookings);

bookRouter.post("/", addBooking);

export default bookRouter; 