import { getAllOrganizers } from "../models/organiserModel.js";
import { Request, Response, NextFunction } from "express";

export const getOrganizers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Fetch all organizers from the database
        const results = await getAllOrganizers();

        // Send the fetched organizers to the frontend
        res.status(200).json({
            message: "Organizers fetched successfully",
            organizers: results
        });

    } catch (err) {
        // Pass the error to the centralized error-handling middleware
        next(err);
    }
};