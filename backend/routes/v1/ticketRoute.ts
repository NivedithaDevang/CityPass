import express from "express";
import {
    getTickets,
    addTicket
} from "../../controllers/ticketController.js";

const ticketRouter = express.Router();


//validation for user
ticketRouter.get("/", getTickets);

export default ticketRouter; 