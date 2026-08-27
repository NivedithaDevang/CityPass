import { getAllOrganizers } from "../models/organiserModel.js"; 
import { Request, Response } from "express";

export const getOrganizers = (req: Request, res: Response) => {
    getAllOrganizers((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch orgnizers",
                error: err
            });
        }

        res.status(200).json({
            message: "Organizers fetched successfully",
            organizers: results
        });
    });
};