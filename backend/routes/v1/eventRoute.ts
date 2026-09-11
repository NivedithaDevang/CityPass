import express from "express";
import {
    getEvents,
    addEvent,
    updateEvent
} from "../../controllers/eventController.js";
import { handleValidation } from "../../middleware/authMiddleware.js";
import { validateEvent } from "../../validators/eventValidator.js";

const eventRouter = express.Router();

eventRouter.get("/", getEvents);

eventRouter.post("/", validateEvent, handleValidation, addEvent);

// eventRouter.put("/:id", updateEvent);

export default eventRouter; 