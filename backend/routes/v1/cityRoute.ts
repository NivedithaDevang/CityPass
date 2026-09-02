import { 
    getCities,
    getCity,
    addCity,
    editCity,
    changeCityStatus
 } from "../../controllers/cityController.js";
import express from "express";
import { validateCity } from "../../service/cityValidator.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkAdminRole } from "../../middleware/roleMiddleware.js";
const cityRouter = express.Router();


//get all cities
cityRouter.get("/", getCities);

//get cities by id
cityRouter.get("/:id", getCity);

//create city [ only admin can post]
cityRouter.post("/", authenticate,
    checkAdminRole,
    validateCity,
    addCity
);

//update city [admin only]
cityRouter.put("/:id",
    authenticate,
    checkAdminRole,
    validateCity,
    editCity
);

//active or inactive city
cityRouter.patch(
    "/:id/status",
    authenticate,
    checkAdminRole,
    changeCityStatus
)
export default cityRouter; 