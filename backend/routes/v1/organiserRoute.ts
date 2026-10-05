import express from "express";
import { getOrganisers, getMyEvents} from "../../controllers/organiserController.js";
import { addEvent } from "../../controllers/eventController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkOrganiserRole } from "../../middleware/roleMiddleware.js";

const organiserRouter = express.Router();
organiserRouter.get( "/", getOrganisers);

// View own events
organiserRouter.get( "/events", authenticate, checkOrganiserRole, getMyEvents );
organiserRouter.post( "/events", authenticate, checkOrganiserRole, addEvent );

export default organiserRouter;