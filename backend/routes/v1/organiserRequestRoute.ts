import express from "express";
import {
    getRequests,
    addRequest

} from "../../controllers/organiserRequestController.js";

const orgRequestRouter = express.Router();

orgRequestRouter.get("/", getRequests);

orgRequestRouter.post("/", addRequest);


export default orgRequestRouter; 