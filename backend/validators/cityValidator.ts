import { Request, Response, NextFunction } from "express";
import { getCityByName } from "../models/cityModel.js";

export const validateCity = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, description } = req.body;

        // Required and type check
        if (!name || typeof name !== "string") {
            return res.status(400).json({
                message: "City name is required and must be a string"
            });
        }

        const trimmedName = name.trim();

        // Empty check
        if (trimmedName.length === 0) {
            return res.status(400).json({
                message: "City name cannot be empty"
            });
        }

        // Max 50 characters
        if (trimmedName.length > 50) {
            return res.status(400).json({
                message: "City name must not exceed 50 characters"
            });
        }

        // Letters, spaces, and hyphens only
        const textOnlyRegex = /^[A-Za-z\s-]+$/;
        if (!textOnlyRegex.test(trimmedName)) {
            return res.status(400).json({
                message: "City name must contain only letters, spaces, or hyphens"
            });
        }

        // Description validation (if provided)
        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be a string"
            });
        }

        // Check for duplicate city in database
        const existingCity = await getCityByName(trimmedName);
        if (existingCity) {
            return res.status(409).json({
                message: "A city with this name already exists"
            });
        }

        // Pass trimmed name downstream
        req.body.name = trimmedName;

        next();
    } catch (error) {
        next(error);
    }
};