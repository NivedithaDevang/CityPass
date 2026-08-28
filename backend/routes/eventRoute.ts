import express from "express";
import {
    getEvents,
    addEvent,
    updateEvent,
    deleteEvent
} from "../controllers/eventController.js";

const eventRouter = express.Router();

eventRouter.get("/", getEvents);

eventRouter.post("/", addEvent);

eventRouter.put("/:id", updateEvent);

eventRouter.delete("/:id", deleteEvent);

export default eventRouter; 