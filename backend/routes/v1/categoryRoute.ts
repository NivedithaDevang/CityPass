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
import { checkAdminRole } from "../../middleware/roleMiddleware.js";
import { getCategoryById } from "../../models/categoryModel.js";
import { validateCategory } from "../../service/categoryValidator.js";
const categoryRouter = express.Router();


//get all categories
categoryRouter.get("/", getCategories);

//get category by id
categoryRouter.get("/:id", getCategoryById);

//create category [ only admin can post]
categoryRouter.post("/", authenticate,
    checkAdminRole,
    validateCategory,
    addCategory
);

//update category [admin only]
categoryRouter.put("/:id",
    authenticate,
    checkAdminRole,
    validateCategory,
    editCategory
);

//active or inactive category
categoryRouter.patch(
    "/:id/status",
    authenticate,
    checkAdminRole,
    changeCategoryStatus
)
export default categoryRouter; 