import express from "express";
import {
    getEvents,
    getActivities,
    getConcerts,
    addEvent,
    updateEvent
} from "../../controllers/eventController.js";

const eventRouter = express.Router();

eventRouter.get("/", getEvents);

eventRouter.post("/", addEvent);

eventRouter.get("/activities", getActivities);

eventRouter.get("/concerts", getConcerts);

eventRouter.put("/:id", updateEvent);

export default eventRouter; 