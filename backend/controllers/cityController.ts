import { getAllCities } from "../models/cityModel.js";
import { Request, Response } from "express";

export const getCities = (req: Request, res: Response) => {
    getAllCities((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch categories",
                error: err
            });
        }

        res.status(200).json({
            message: "Cities fetched successfully",
            users: results
        });
    });
};