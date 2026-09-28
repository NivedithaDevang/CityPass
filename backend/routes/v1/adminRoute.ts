import express from "express";
import {  getUsers,
  getCategories,
  getCities,
  getEvents,
  getOragniserRequests,
  getOrganisers,
  addCityAdmin,
  deleteCityAdmin
 } from "../../controllers/adminController.js";
 import { editCity } from "../../controllers/cityController.js";
 import { addCategory, editCategory } from "../../controllers/categoryController.js";
 import { updateOrganizerRequestStatus } from "../../controllers/organiserRequestController.js";
 import { updateEventStatus } from "../../controllers/eventController.js";
 import { addCity } from "../../controllers/cityController.js";
import { checkAdminRole, checkCityAccess } from "../../middleware/roleMiddleware.js";
import { authenticate } from "../../middleware/authMiddleware.js";


const adminRouter = express.Router();

//get
adminRouter.get("/users", checkAdminRole, getUsers);
adminRouter.get("/organiser-requests", checkAdminRole, getOragniserRequests);
adminRouter.get("/organisers", checkAdminRole, getOrganisers);
adminRouter.get("/cities", checkAdminRole, getCities);
adminRouter.get("/categories", checkAdminRole, getCategories);
adminRouter.get("/events", checkAdminRole, getEvents);

//post
adminRouter.post("/add-city", authenticate, checkAdminRole, addCity);
adminRouter.post("/add-category", authenticate, checkAdminRole, addCategory);
adminRouter.post("/city-admin", authenticate, checkAdminRole, addCityAdmin);

//patch
adminRouter.patch("/edit-city", authenticate, checkAdminRole, editCity);
adminRouter.patch("/edit-category", authenticate, checkAdminRole, editCategory);
adminRouter.patch("/organizer-requests/:id/status", authenticate, checkAdminRole, updateOrganizerRequestStatus);
adminRouter.patch("/events/:id/status", authenticate, checkAdminRole, updateEventStatus);
adminRouter.patch("/cities/:id", authenticate, checkAdminRole, checkCityAccess, editCity);

//delete
adminRouter.delete("/delete-admin", checkAdminRole, deleteCityAdmin);




export default adminRouter;