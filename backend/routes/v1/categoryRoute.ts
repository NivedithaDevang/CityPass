import { 
    getCategories,
    addCategory,
    editCategory
 } from "../../controllers/categoryController.js";
import express from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkAdminRole } from "../../middleware/roleMiddleware.js";
import { validateCategory } from "../../validators/categoryValidator.js";
import { validateIdParam } from "../../validators/idValidator.js";
const categoryRouter = express.Router();


//get all categories
categoryRouter.get("/", getCategories);


//create category [ only admin can post]
categoryRouter.post("/", authenticate,
    checkAdminRole,
    validateCategory,
    addCategory
);

//update category [admin only]
categoryRouter.put("/:id",
    validateIdParam,
    authenticate,
    checkAdminRole,
    validateCategory,
    editCategory
);


export default categoryRouter; 