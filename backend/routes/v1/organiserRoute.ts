import express from "express";
import { getOrganisers, getMyBookings, getMyEvents} from "../../controllers/organiserController.js";
import { addEvent } from "../../controllers/eventController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkOrganiserRole } from "../../middleware/roleMiddleware.js";
import { validateEvent } from "../../validators/eventValidator.js";
import { updateEvent } from "../../controllers/eventController.js";
import { handleValidation } from "../../middleware/validate.js";
import upload from "../../middleware/upload.js";

import {
  addTemplateToEvent,
  addCustomEventTicket,
} from "../../controllers/eventTicketController.js";


const organiserRouter = express.Router();
organiserRouter.get( "/", getOrganisers);

// View own events
organiserRouter.get( "/events", authenticate, checkOrganiserRole, getMyEvents );
organiserRouter.get( "/bookings", authenticate, checkOrganiserRole, getMyBookings );
organiserRouter.post("/add-event",authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, addEvent);
organiserRouter.patch("/edit-event/:id", authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, updateEvent);

organiserRouter.post("/events/:eventId/tickets/template", authenticate, checkOrganiserRole, addTemplateToEvent);

organiserRouter.post( "/events/:eventId/tickets/custom", authenticate, checkOrganiserRole, addCustomEventTicket);
export default organiserRouter;