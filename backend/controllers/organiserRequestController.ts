import { Request, Response, NextFunction } from "express";

import {
    getAllRequests,
    createRequest,
    updateRequestStatus,
} from "../models/organiserRequestModel.js";


// Get all requests
export const getRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const results = await getAllRequests();

        res.status(200).json({
            message: "Requests fetched successfully",
            requests: results,
        });

    } catch (err) {
        next(err);
    }
};


// Create organizer request
export const addRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const {
            organization_name,
            description,
            category,
            city,
            pan_card,
            email,
            phone
        } = req.body;


        if (
            !organization_name?.trim() ||
            !description?.trim()
        ) {
            return res.status(400).json({
                message: "organization_name and description are required"
            });
        }


        if (description.trim().length < 300) {
            return res.status(400).json({
                message: "Description must be at least 300 characters long"
            });
        }


        const result = await createRequest({
            organization_name: organization_name.trim(),
            description: description.trim(),
            category: category?.trim(),
            city: city?.trim(),
            pan_card: pan_card?.trim(),
            email: email?.trim(),
            phone: phone?.trim(),
            status: "PENDING"
        });


        res.status(201).json({
            message: "Request submitted successfully",
            requestId: result.insertId
        });

    } catch (err) {
        next(err);
    }
};


// Update organizer request status
export const updateOrganizerRequestStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const requestId = Number(req.params.id);

        const { status } = req.body;


        if (
            !Number.isInteger(requestId) ||
            requestId <= 0
        ) {
            return res.status(400).json({
                message: "A valid request id is required"
            });
        }


        if (
            status !== "APPROVED" &&
            status !== "REJECTED"
        ) {
            return res.status(400).json({
                message: "Status must be APPROVED or REJECTED"
            });
        }


        const result = await updateRequestStatus(
            requestId,
            status
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Request not found"
            });
        }


        res.status(200).json({
            message:
                status === "APPROVED"
                    ? "Organizer request approved successfully"
                    : "Organizer request rejected successfully"
        });

    } catch (err) {
        next(err);
    }
};