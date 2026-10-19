import express from "express";
import { getOrganisers, getMyBookings, getMyEvents} from "../../controllers/organiserController.js";
import { addEvent, cancelOrganiserEvent, goEventLive } from "../../controllers/eventController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkOrganiserRole } from "../../middleware/roleMiddleware.js";
import { validateEvent } from "../../validators/eventValidator.js";
import { updateEvent } from "../../controllers/eventController.js";
import { handleValidation } from "../../middleware/validate.js";
import upload from "../../middleware/upload.js";

import {
  addCustomEventTicket,
  editCustomEventTicket,
  removeCustomEventTicket,
} from "../../controllers/eventTicketController.js";



const organiserRouter = express.Router();


// View own events
organiserRouter.get( "/events", authenticate, checkOrganiserRole, getMyEvents );
organiserRouter.get( "/bookings", authenticate, checkOrganiserRole, getMyBookings );
organiserRouter.post("/add-event",authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, addEvent);
organiserRouter.patch("/edit-event/:id", authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, updateEvent);
organiserRouter.patch("/cancel-event/:id", authenticate, checkOrganiserRole, cancelOrganiserEvent);
organiserRouter.patch("/live-event/:id", authenticate, checkOrganiserRole, goEventLive);

organiserRouter.post( "/events/:eventId/tickets/custom", authenticate, checkOrganiserRole, addCustomEventTicket);
organiserRouter.patch("/events/:eventId/tickets/:ticketId", authenticate, checkOrganiserRole, editCustomEventTicket);
organiserRouter.delete("/events/:eventId/tickets/:ticketId", authenticate, checkOrganiserRole, removeCustomEventTicket);
export default organiserRouter;