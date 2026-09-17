import { getOrganizers } from "../../controllers/organiserController.js";
import express from "express";

const organiserRouter = express.Router();

organiserRouter.get("/", getOrganizers);


export default organiserRouter; 