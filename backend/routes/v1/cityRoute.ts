import { 
    getCities,
    addCity,
    editCity
 } from "../../controllers/cityController.js";
import express from "express";
import { validateCity } from "../../validators/cityValidator.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkAdminRole } from "../../middleware/roleMiddleware.js";
import { validateIdParam } from "../../validators/idValidator.js";
const cityRouter = express.Router();


//get all cities
cityRouter.get("/", getCities);

//create city [ only admin can post]
cityRouter.post("/", authenticate,
    checkAdminRole,
    validateCity,
    addCity
);

//update city [admin only]
cityRouter.put("/:id",
    validateIdParam,
    authenticate,
    checkAdminRole,
    validateCity,
    editCity
);


export default cityRouter; 