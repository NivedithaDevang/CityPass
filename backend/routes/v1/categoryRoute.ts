import { 
    getCategories,
    getCategory,
    addCategory,
    editCategory,
    changeCategoryStatus
 } from "../../controllers/categoryController.js";
import express from "express";
import { validateCity } from "../../service/cityValidator.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";
import { getCategoryById } from "../../models/categoryModel.js";
import { validateCategory } from "../../service/categoryValidator.js";
const categoryRouter = express.Router();


//get all categories
categoryRouter.get("/", getCategories);

//get category by id
categoryRouter.get("/:id", getCategoryById);

//create categor [ only admin can post]
categoryRouter.post("/", authenticate,
    authorize("ADMIN"),
    validateCategory,
    addCategory
);

//update city [admin only]
categoryRouter.put("/:id",
    authenticate,
    authorize("ADMIN"),
    validateCategory,
    editCategory
);

//active or inactive city
categoryRouter.patch(
    "/:id/status",
    authenticate,
    authorize("ADMIN"),
    changeCategoryStatus
)
export default categoryRouter; 