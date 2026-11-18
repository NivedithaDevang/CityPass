import { 
    getCities,
    addCity,
    editCity
 } from "../../controllers/cityController.js";
import express from "express";

const cityRouter = express.Router();


//get all cities
cityRouter.get("/", getCities);



export default cityRouter; 