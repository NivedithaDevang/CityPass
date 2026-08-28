import express from "express";
import {
    getPasses,
    addPass,
    deletePass
} from "../controllers/passController.js";

const passRouter = express.Router();

passRouter.get("/", getPasses);

passRouter.post("/", addPass);

passRouter.delete("/:id", deletePass);

export default passRouter; 