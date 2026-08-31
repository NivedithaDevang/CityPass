import express from "express";
import {
    getRequests,
    addRequest,
    updateRequest
} from "../../controllers/orgRequestController.js";

const orgReqRouter = express.Router();

orgReqRouter.get("/", getRequests);

orgReqRouter.post("/", addRequest);

orgReqRouter.put("/:id", updateRequest);


export default orgReqRouter; 