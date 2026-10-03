import express from "express";
import { addCityAdmin, deleteCityAdmin } from "../../controllers/adminController.js";
import { getUsers } from "../../controllers/userController.js";
import { getCategories, addCategory, editCategory } from "../../controllers/categoryController.js";
import { getCities, addCity, editCity } from "../../controllers/cityController.js";
import { getEvents, updateEventStatus } from "../../controllers/eventController.js";
import { getOrganisers } from "../../controllers/organiserController.js";
import { getRequests, updateOrganizerRequestStatus } from "../../controllers/organiserRequestController.js";
import { getTickets, addTicket, deleteTicket } from "../../controllers/ticketController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkAdminRole, checkCityAccess } from "../../middleware/roleMiddleware.js";

const adminRouter = express.Router();

adminRouter.use( authenticate, checkAdminRole );

adminRouter.get( "/users", getUsers );
adminRouter.get( "/categories", getCategories );
adminRouter.get( "/cities", getCities );
adminRouter.get( "/events", getEvents);
adminRouter.get( "/organisers", getOrganisers );
adminRouter.get( "/organiser-requests", getRequests );
adminRouter.get( "/tickets", getTickets);


adminRouter.post( "/add-city", addCity );
adminRouter.post( "/add-category", addCategory );
adminRouter.post( "/city-admin", addCityAdmin );
adminRouter.post( "/add-ticket", addTicket);


adminRouter.patch( "/cities/:id", editCity );
adminRouter.patch( "/categories/:id", editCategory );
adminRouter.patch( "/organiser-requests/:id/status", updateOrganizerRequestStatus );
adminRouter.patch( "/events/:id/status", updateEventStatus );
adminRouter.patch( "/cities/:id", checkCityAccess, editCity );
adminRouter.patch( "/tickets/:id/delete", deleteTicket );
adminRouter.patch( "/cities/:id", editCity );

adminRouter.delete( "/delete-admin/:id", deleteCityAdmin );


export default adminRouter;