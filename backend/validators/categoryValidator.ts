import { Request, Response, NextFunction } from "express";

export const validateCategory = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{

    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
            message: "Category name is required"
        });
    }
    const trimmedName = name.trim();

    if(trimmedName.length === 0){
        return res.status(400).json({
            message: "Category name cannot be empty"
        });
    }

    if(trimmedName.length > 25){
        return res.status(400).json({
            message: "Category name cannot exceed 25 characters"
        });
    }
    const textOnlyRegex = /^[A-Za-z\s-]+$/;
        if (!textOnlyRegex.test(trimmedName)) {
            return res.status(400).json({
                message: "Category name must contain only letters, spaces, or hyphens"
            });
        }

    next();
} catch(error) {
    next(error);
}
};