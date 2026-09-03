import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const generateToken = (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;

    if (!user) {
        return res.status(500).json({ message: "User context missing for token generation" });
    }

    try {
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );

        res.locals.token = token;
        next();
    } catch (err) {
        next(err);
    }
};