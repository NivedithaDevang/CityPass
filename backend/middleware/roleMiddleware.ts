import { Request, Response, NextFunction } from "express";
export const checkAdminRole = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const role = req.user?.role?.toUpperCase();
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return res.status(403).json({
            message: "You do not have permission to access this action."
        });
    }
    next();
};

export const checkSuperAdminRole = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    if (req.user?.role !== "SUPER_ADMIN") {
        return res.status(403).json({
            message: "You do not have permission to access this action."
        });
    }

    next();
};

// Checks whether an admin is allowed to access a particular city
export const checkCityAccess = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    // Super Admin can access every city
    if (req.user?.role === "SUPER_ADMIN") {
        return next();
    }

    // Only City Admin reaches this point
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            message: "You do not have permission to access this city."
        });
    }

    const adminCityId = req.user.city_id;
    const requestedCityId = Number(req.params.id);

    // Admin must have a city assigned
    if (!adminCityId) {
        return res.status(403).json({
            message: "No city is assigned to this admin."
        });
    }

    // Check whether requested city belongs to this admin
    if (adminCityId !== requestedCityId) {
        return res.status(403).json({
            message: "You do not have permission to access this city."
        });
    }

    next();
};

export const checkOrganiserRole = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const role = req.user?.role?.toUpperCase();
    if (role !== "ORGANISER") {
        return res.status(403).json({
            message: "You do not have permission to access this action."
        });
    }
    next();
};