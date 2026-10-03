import express from "express";
import {
    getEvents,
    getActivities,
    getConcerts,
    updateEvent,
    getEventDetailsBySlug,
    addEvent
} from "../../controllers/eventController.js";
import { handleValidation } from "../../middleware/validate.js";
import { validateEvent } from "../../validators/eventValidator.js";
import { validateIdParam } from "../../validators/idValidator.js";
import { checkAdminRole } from "../../middleware/roleMiddleware.js";
const eventRouter = express.Router();

eventRouter.get("/events", getEvents);

eventRouter.post("/add-event", validateEvent, handleValidation, checkAdminRole, addEvent);

eventRouter.get("/events/activities", getActivities);

eventRouter.get("/events/concerts", getConcerts);

eventRouter.put("/:id", validateIdParam, checkAdminRole, updateEvent);
eventRouter.get("/:slug", getEventDetailsBySlug);

export default eventRouter; 