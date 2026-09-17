import express from "express";
import {
    getEvents,
    getEventDetailsBySlug,
    addEvent
} from "../../controllers/eventController.js";
import { handleValidation } from "../../middleware/authMiddleware.js";
import { validateEvent } from "../../validators/eventValidator.js";

const eventRouter = express.Router();

eventRouter.get("/", getEvents);

eventRouter.post("/", validateEvent, handleValidation, addEvent);

eventRouter.get("/:slug", getEventDetailsBySlug);

export default eventRouter; 