import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const handleValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

export const verifyRole = (allowedRoles: string | string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if( !req.user ){
            return res.status(401).json({
                message: "User not authenticated"
            });
        }

        // Ensure allowedRoles is always an array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if( !roles.includes(req.user.role) ){
            return res.status(403).json({
                message: "User not authorized"
            });
        }

        next();
    };
}
