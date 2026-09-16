import jwt from "jsonwebtoken";
import { Response } from "express";


//generate token for user
export const generateUserToken = (res: Response, user: any) => {

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            token_version: user.token_version
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "1h"
        }
    );

    res.cookie("userToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });

    return token;
};

//generate token for events
export const generateEventToken = (res: Response, event: any) => {
    const token = jwt.sign(
        {
            eventId: event.id
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "1h"
        }
    );

    res.cookie("eventToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });

    return token;
};