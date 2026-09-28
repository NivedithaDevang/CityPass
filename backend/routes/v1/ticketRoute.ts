import express from "express";
import {
    getTickets,
    addTicket
} from "../../controllers/ticketController.js";

const ticketRouter = express.Router();


//validation for user
ticketRouter.get("/", getTickets);

//validation for organiser
ticketRouter.post("/", addTicket);

export default ticketRouter; 