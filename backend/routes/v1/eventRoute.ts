import express from "express";
import {
    getEvents,
    getActivities,
    getConcerts,
    updateEvent,
    getEventDetailsBySlug
} from "../../controllers/eventController.js";
import { validateIdParam } from "../../validators/idValidator.js";
import { checkAdminRole } from "../../middleware/roleMiddleware.js";

import {
  getEventTicketTemplates,
  getTicketsForEvent,
} from "../../controllers/eventTicketController.js";


const eventRouter = express.Router();

eventRouter.get("/events", getEvents);

eventRouter.get("/events/activities", getActivities);

eventRouter.get("/events/concerts", getConcerts);

eventRouter.put("/:id", validateIdParam, checkAdminRole, updateEvent);
eventRouter.get("/:slug", getEventDetailsBySlug);

// Public ticket reads
eventRouter.get(
  "/:eventId/ticket-templates",
  getEventTicketTemplates
);

eventRouter.get(
  "/:eventId/tickets",
  getTicketsForEvent
);

export default eventRouter; 