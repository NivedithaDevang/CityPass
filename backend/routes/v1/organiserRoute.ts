import express from "express";
import { getOrganisers, getMyBookings, getMyEvents} from "../../controllers/organiserController.js";
import { addEvent } from "../../controllers/eventController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkOrganiserRole } from "../../middleware/roleMiddleware.js";
import { validateEvent } from "../../validators/eventValidator.js";
import { updateEvent } from "../../controllers/eventController.js";
import { handleValidation } from "../../middleware/validate.js";
import upload from "../../middleware/upload.js";
const organiserRouter = express.Router();
organiserRouter.get( "/", getOrganisers);

// View own events
organiserRouter.get( "/events", authenticate, checkOrganiserRole, getMyEvents );
organiserRouter.get( "/bookings", authenticate, checkOrganiserRole, getMyBookings );
organiserRouter.post("/add-event",authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, addEvent);
organiserRouter.patch("/edit-event", authenticate, checkOrganiserRole, upload.single("image"), validateEvent, handleValidation, updateEvent);
export default organiserRouter;