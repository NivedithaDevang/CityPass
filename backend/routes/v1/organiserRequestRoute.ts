import express from "express";
import {
    getRequests,
    addRequest,
    updateRequest
} from "../../controllers/organiserRequestController.js";

const orgRequestRouter = express.Router();

orgRequestRouter.get("/", getRequests);

orgRequestRouter.post("/", addRequest);

orgRequestRouter.put("/:id", updateRequest);


export default orgRequestRouter; 