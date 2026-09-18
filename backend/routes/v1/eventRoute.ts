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

const eventRouter = express.Router();

eventRouter.get("/", getEvents);

eventRouter.post("/", validateEvent, handleValidation, addEvent);

eventRouter.get("/activities", getActivities);

eventRouter.get("/concerts", getConcerts);

eventRouter.put("/:id", updateEvent);
eventRouter.get("/:slug", getEventDetailsBySlug);

export default eventRouter; 