import express from "express";
import { verifySuperAdminKey, approveOrganiser } from "../../controllers/adminController.js";
import { getUsers } from "../../controllers/userController.js";
import { getCategories, addCategory, editCategory } from "../../controllers/categoryController.js";
import { getCities, addCity, editCity } from "../../controllers/cityController.js";
import { getAdminEventRequests, getEvents, updateEventStatus } from "../../controllers/eventController.js";
import { getOrganisers } from "../../controllers/organiserController.js";
import { getRequests } from "../../controllers/organiserRequestController.js";
import { getTickets, addTicket, deleteTicket } from "../../controllers/ticketController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkAdminRole, checkCityAccess } from "../../middleware/roleMiddleware.js";

const adminRouter = express.Router();

adminRouter.post("/verify-super-admin-key", authenticate, verifySuperAdminKey);

adminRouter.use( authenticate, checkAdminRole );

adminRouter.get( "/users", getUsers );
adminRouter.get( "/categories", getCategories );
adminRouter.get( "/cities", getCities );
adminRouter.get( "/events", getEvents);
adminRouter.get( "/event-requests", getAdminEventRequests);
adminRouter.get( "/organisers", getOrganisers );
adminRouter.get( "/organiser-requests", getRequests );
adminRouter.get( "/tickets", getTickets);


adminRouter.post( "/add-city", addCity );
adminRouter.post( "/add-category", addCategory );
adminRouter.post( "/add-ticket", addTicket);


adminRouter.patch( "/cities/:id", editCity );
adminRouter.patch( "/categories/:id", editCategory );
adminRouter.patch( "/events/:id/status", updateEventStatus );
adminRouter.patch( "/cities/:id", checkCityAccess, editCity );
adminRouter.patch( "/tickets/:id/delete", deleteTicket );
adminRouter.patch( "/cities/:id", editCity );
adminRouter.patch( "/organiser-requests/:id/approve", authenticate, checkAdminRole, approveOrganiser);



export default adminRouter;