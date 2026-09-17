import express from "express";
import {
    getEvents,
<<<<<<< HEAD
    getActivities,
    getConcerts,
    addEvent,
    updateEvent
=======
    getEventDetailsBySlug,
    addEvent
>>>>>>> events-page
} from "../../controllers/eventController.js";
import { handleValidation } from "../../middleware/validate.js";
import { validateEvent } from "../../validators/eventValidator.js";

const eventRouter = express.Router();

eventRouter.get("/", getEvents);

eventRouter.post("/", validateEvent, handleValidation, addEvent);

<<<<<<< HEAD
eventRouter.get("/activities", getActivities);

eventRouter.get("/concerts", getConcerts);

eventRouter.put("/:id", updateEvent);
=======
eventRouter.get("/:slug", getEventDetailsBySlug);
>>>>>>> events-page

export default eventRouter; 