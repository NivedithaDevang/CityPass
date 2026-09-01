import { Request, Response, NextFunction } from "express";

export const validateCity = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
            message: "City name is required"
        });
    }

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        return res.status(400).json({
            message: "Description must be a string"
        });
    }

    next();
};