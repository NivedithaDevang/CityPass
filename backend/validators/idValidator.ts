import { Request, Response, NextFunction } from "express";

export const validateIdParam = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const rawId = req.params.id;

    // Check if id exists
    if (typeof rawId !== "string" || rawId.length === 0) {
        return res.status(400).json({
            message: "ID parameter is required"
        });
    }

    // Check that ID contains only digits
    if (!/^\d+$/.test(rawId)) {
        return res.status(400).json({
            message: "ID must be a positive integer"
        });
    }

    // Convert string to number
    const parsedId = Number(rawId);

    // Check that the number is positive and safe
    if (parsedId <= 0 || !Number.isSafeInteger(parsedId)) {
        return res.status(400).json({
            message: "ID must be a valid positive integer"
        });
    }

    next();
};