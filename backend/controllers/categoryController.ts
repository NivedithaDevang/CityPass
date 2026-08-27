import { getAllCategories } from "../models/categoryModel.js";
import { Request, Response } from "express";

export const getCategories = (req: Request, res: Response) => {
    getAllCategories((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch categories",
                error: err
            });
        }

        res.status(200).json({
            message: "Categories fetched successfully",
            users: results
        });
    });
};