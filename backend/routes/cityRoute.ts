import { getCities } from "../controllers/cityController.js";
import express from "express";

const cityRouter = express.Router();

cityRouter.get("/", getCities);


export default cityRouter; 