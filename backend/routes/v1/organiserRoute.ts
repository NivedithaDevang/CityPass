import { get } from "node:http";
import { getOrganizers } from "../../controllers/organiserController.js";
import express from "express";

const organizerRouter = express.Router();

organizerRouter.get("/", getOrganizers);


export default organizerRouter; 