import express from "express";
import {
    getBookings,
    addBooking,
    deleteBooking
} from "../controllers/bookingController.js";

const bookRouter = express.Router();

bookRouter.get("/", getBookings);

bookRouter.post("/", addBooking);

bookRouter.delete("/:id", deleteBooking);

export default bookRouter; 