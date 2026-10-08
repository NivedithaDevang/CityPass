import express from "express";
import {
    getRequests,
    addRequest
} from "../../controllers/organiserRequestController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const orgRequestRouter = express.Router();

orgRequestRouter.post("/", authenticate, addRequest);
orgRequestRouter.get("/", authenticate, getRequests);


export default orgRequestRouter;