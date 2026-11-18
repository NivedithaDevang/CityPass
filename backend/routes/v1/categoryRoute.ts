import { 
    getCategories,
    addCategory,
    editCategory
 } from "../../controllers/categoryController.js";
import express from "express";
const categoryRouter = express.Router();


//get all categories
categoryRouter.get("/", getCategories);




export default categoryRouter; 