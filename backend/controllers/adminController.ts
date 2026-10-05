import { Request, Response, NextFunction } from "express";

import {
    approveOrganiserRequest
} from "../models/adminModel.js";
import { ADMIN_SECRET_KEY, SUPER_ADMIN_EMAIL } from "../config/env.js";


export const verifySuperAdminKey = (
    req: Request,
    res: Response
) => {
    const userEmail = req.user?.email?.toLowerCase().trim();
    const userRole = req.user?.role?.toUpperCase();
    const isSuperAdmin =
        userRole === "SUPER_ADMIN" ||
        (!!SUPER_ADMIN_EMAIL && userEmail === SUPER_ADMIN_EMAIL);

    if (!isSuperAdmin) {
        return res.status(403).json({
            message: "You do not have permission to access this action."
        });
    }

    if (!ADMIN_SECRET_KEY) {
        return res.status(503).json({
            message: "The super admin key is not configured on the server."
        });
    }

    if (req.body?.secretKey !== ADMIN_SECRET_KEY) {
        return res.status(401).json({
            message: "Invalid secret key. Please try again."
        });
    }

    return res.status(200).json({
        message: "Super admin key verified."
    });
};


export const approveOrganiser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const requestId = Number(req.params.id);

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return res.status(400).json({
        message: "A valid request id is required",
      });
    }

    await approveOrganiserRequest(requestId);

    return res.status(200).json({
      message: "Organiser request approved successfully",
    });

  } catch (err) {
    next(err);
  }
};