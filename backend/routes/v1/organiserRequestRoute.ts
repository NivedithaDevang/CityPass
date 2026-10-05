import express from "express";
import {
    getRequests,
    addRequest,
    updateOrganizerRequestStatus
} from "../../controllers/organiserRequestController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const orgRequestRouter = express.Router();

orgRequestRouter.post("/", authenticate, addRequest);
orgRequestRouter.get("/", authenticate, getRequests);
orgRequestRouter.patch("/:id/status", authenticate, updateOrganizerRequestStatus);

export default orgRequestRouter;