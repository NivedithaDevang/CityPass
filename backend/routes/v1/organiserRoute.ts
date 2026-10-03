import { getOrganisers } from "../../controllers/organiserController.js";
import express from "express";

const organiserRouter = express.Router();

organiserRouter.get("/", getOrganisers);


export default organiserRouter; 