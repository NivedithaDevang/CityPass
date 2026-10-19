import express from "express";
import {
    addRequest,
    getMyRequestStatus,
} from "../../controllers/organiserRequestController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const organiserRequestRouter = express.Router();

organiserRequestRouter.get("/status", authenticate, getMyRequestStatus);
organiserRequestRouter.post("/", authenticate, addRequest);



export default organiserRequestRouter;