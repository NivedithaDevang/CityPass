import express from "express";
import {
    getEvents,
    getActivities,
    getConcerts,
    getEventDetailsBySlug
} from "../../controllers/eventController.js";

import { getTicketsForEvent } from "../../controllers/eventTicketController.js";


const eventRouter = express.Router();

eventRouter.get("/events", getEvents);
eventRouter.get("/activities", getActivities);
eventRouter.get("/concerts", getConcerts);

eventRouter.get("/:slug", getEventDetailsBySlug);

eventRouter.get(
  "/:eventId/tickets",
  getTicketsForEvent
);

export default eventRouter; 