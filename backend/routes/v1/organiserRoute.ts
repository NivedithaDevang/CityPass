import express from "express";
import {
  deactivateOrganiserAccount,
  getMyBookings,
  getMyEvents,
  getOrganiserProfile,
  updateProfile,
} from "../../controllers/organiserController.js";
import {
  addEvent,
  cancelOrganiserEvent,
  goEventLive,
  updateEvent,
} from "../../controllers/eventController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkOrganiserRole } from "../../middleware/roleMiddleware.js";
import { validateEvent } from "../../validators/eventValidator.js";
import { handleValidation } from "../../middleware/validate.js";
import upload from "../../middleware/upload.js";
import {
  addCustomEventTicket,
  editCustomEventTicket,
  removeCustomEventTicket,
} from "../../controllers/eventTicketController.js";

const organiserRouter = express.Router();

// Organiser profile routes
organiserRouter.get("/profile", authenticate, checkOrganiserRole, getOrganiserProfile);
organiserRouter.patch("/profile", authenticate, checkOrganiserRole, updateProfile);

// Events & bookings
organiserRouter.get("/events", authenticate, checkOrganiserRole, getMyEvents);
organiserRouter.get("/bookings", authenticate, checkOrganiserRole, getMyBookings);
organiserRouter.post("/add-event", authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, addEvent);
organiserRouter.patch("/edit-event/:id", authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, updateEvent);
organiserRouter.patch("/cancel-event/:id", authenticate, checkOrganiserRole, cancelOrganiserEvent);
organiserRouter.patch("/live-event/:id", authenticate, checkOrganiserRole, goEventLive);
organiserRouter.patch("/deactivate", authenticate, checkOrganiserRole, deactivateOrganiserAccount);

// Custom tickets
organiserRouter.post("/events/:eventId/tickets/custom", authenticate, checkOrganiserRole, addCustomEventTicket);
organiserRouter.patch("/events/:eventId/tickets/:ticketId", authenticate, checkOrganiserRole, editCustomEventTicket);
organiserRouter.delete("/events/:eventId/tickets/:ticketId", authenticate, checkOrganiserRole, removeCustomEventTicket);

export default organiserRouter;