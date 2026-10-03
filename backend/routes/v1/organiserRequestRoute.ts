import express from "express";
import {
    addRequest

} from "../../controllers/organiserRequestController.js";

const orgRequestRouter = express.Router();


orgRequestRouter.post("/", addRequest);


export default orgRequestRouter; 