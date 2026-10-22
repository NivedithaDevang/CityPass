import express from "express";
import {
    getEvents,
    getEventDetailsBySlug
} from "../../controllers/eventController.js";

import { getTicketsForEvent } from "../../controllers/eventTicketController.js";


const eventRouter = express.Router();

eventRouter.get("/events", getEvents);

eventRouter.get("/:slug", getEventDetailsBySlug);

eventRouter.get(
  "/:eventId/tickets",
  getTicketsForEvent
);

export default eventRouter; 