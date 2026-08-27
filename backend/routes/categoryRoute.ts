import { getCategories } from "../controllers/categoryController.js";
import express from "express";

const categoryRouter = express.Router();

categoryRouter.get("/", getCategories);


export default categoryRouter; 