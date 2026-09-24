import jwt from "jsonwebtoken";
import { Response } from "express";
import { JWT_SECRET } from "../config/env.js"; // Must match authMiddleware

export const generateUserToken = (userId: number, res: Response, user: any) => {
  const payload = {
    id: userId || user?.id,
    email: user?.email,
    role: user?.role || "USER",
    token_version: user?.token_version ?? 0,
  };

  const token = jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: "1h",
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie("userToken", token, cookieOptions);
  res.cookie("token", token, cookieOptions);

  return token;
};