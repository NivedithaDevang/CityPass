import express from "express";
import {
    addRequest,
    getMyRequestStatus,
} from "../../controllers/organiserRequestController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { idProofUpload } from "../../middleware/upload.js";

const organiserRequestRouter = express.Router();

organiserRequestRouter.get("/status", authenticate, getMyRequestStatus);
organiserRequestRouter.post(
    "/",
    authenticate,
    idProofUpload.single("id_proof_file"),
    addRequest
);



export default organiserRequestRouter;