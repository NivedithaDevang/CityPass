import { Request, Response, NextFunction } from "express";
import { getAllOrganisers } from "../models/organiserModel.js";

export const getOrganisers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const organisers = await getAllOrganisers();

        res.status(200).json({
            message: "Organisers fetched successfully",
            organisers: organisers
        });

    } catch (err) {
        next(err);
    }
};