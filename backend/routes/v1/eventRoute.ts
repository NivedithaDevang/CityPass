import express from "express";
import {
    getEvents,
    addEvent,
    updateEvent
} from "../../controllers/eventController.js";

const eventRouter = express.Router();

eventRouter.get("/", getEvents);

eventRouter.post("/", addEvent);

eventRouter.put("/:id", updateEvent);

export default eventRouter; 