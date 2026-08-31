import express from "express";
import {
    getTickets,
    addTicket
} from "../../controllers/ticketController.js";

const ticketRouter = express.Router();

ticketRouter.get("/", getTickets);

ticketRouter.post("/", addTicket);

export default ticketRouter; 