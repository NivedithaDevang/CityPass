import express from "express";
import {
    getRequests,
    addRequest,
    updateRequest,
    deleteRequest
} from "../controllers/orgRequestController.js";

const orgReqRouter = express.Router();

orgReqRouter.get("/", getRequests);

orgReqRouter.post("/", addRequest);

orgReqRouter.put("/:id", updateRequest);

orgReqRouter.delete("/:id", deleteRequest);

export default orgReqRouter; 