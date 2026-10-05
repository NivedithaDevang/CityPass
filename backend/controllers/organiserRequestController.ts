import { Request, Response, NextFunction } from "express";
import {
    getAllRequests,
    getOrganizerRequestById,
    getActiveRequestByUserId,
    createRequest,
    approveOrganizerTransaction,
    rejectOrganizerRequest
} from "../models/organiserRequestModel.js";

// GET /api/v1/organiser-requests
export const getRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const results = await getAllRequests();
        return res.status(200).json({
            message: "Requests fetched successfully",
            requests: results
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/organiser-requests
export const addRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized: Please log in again."
            });
        }

        // Prevent duplicate submissions
        const existing = await getActiveRequestByUserId(Number(userId));
        if (existing) {
            return res.status(409).json({
                message:
                    existing.status === "APPROVED"
                        ? "You are already a registered organizer."
                        : "You already have an organizer application pending review."
            });
        }

        // Support both naming conventions
        const stageName = (req.body.organization_name || req.body.stageName || "").trim();
        const description = (req.body.description || "").trim();
        const category = (req.body.category || "").trim();
        const city = (req.body.city || "").trim();
        const email = (req.body.email || "").trim();
        const phone = (req.body.phone || "").trim();
        const pan_card = (req.body.pan_card || "").trim().toUpperCase();

        if (!stageName || !description || !category || !city || !email || !phone || !pan_card) {
            return res.status(400).json({
                message: "All fields are required. Please fill in every field."
            });
        }

        if (description.length < 300) {
            return res.status(400).json({
                message: "Description must be at least 300 characters long."
            });
        }

        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(pan_card)) {
            return res.status(400).json({
                message: "Invalid PAN card format (expected 5 letters, 4 digits, 1 letter)."
            });
        }

        const result = await createRequest({
            user_id: Number(userId),
            organization_name: stageName,
            description,
            category,
            city,
            pan_card,
            email,
            phone,
            status: "PENDING"
        });

        return res.status(201).json({
            message: "Organizer request submitted successfully!",
            requestId: result.insertId
        });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/v1/organiser-requests/:id/status
export const updateOrganizerRequestStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const requestId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                message: "A valid request id is required"
            });
        }

        if (status !== "APPROVED" && status !== "REJECTED") {
            return res.status(400).json({
                message: "Status must be APPROVED or REJECTED"
            });
        }

        const existingRequest = await getOrganizerRequestById(requestId);
        if (!existingRequest) {
            return res.status(404).json({
                message: "Organizer request not found."
            });
        }

        if (existingRequest.status !== "PENDING") {
            return res.status(400).json({
                message: `Request is already ${existingRequest.status.toLowerCase()}.`
            });
        }

        if (status === "APPROVED") {
            await approveOrganizerTransaction(existingRequest);
            return res.status(200).json({
                message: "Organizer request approved and organizer profile created successfully."
            });
        }

        await rejectOrganizerRequest(requestId);
        return res.status(200).json({
            message: "Organizer request rejected successfully."
        });
    } catch (err) {
        next(err);
    }
};