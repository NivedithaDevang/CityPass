import { getAllRequests,
    createRequest, 
    updateRequest as updateOrgReq
     } 
    from "../models/organiserRequestModel.js";
import { Request, Response, NextFunction } from "express";


//for getting all requests
export const getRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const results = await getAllRequests();

        res.status(200).json({
            message: "Requests fetched successfully",
            requests: results
        });
    } catch (err) {
        next(err);
    }
};

//for posting new request
export const addRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { organization_name, description } = req.body;

        if (!organization_name?.trim() || !description?.trim()) {
            return res.status(400).json({
                message: "organization_name and description are required"
            });
        }

        const result = await createRequest({
            organization_name: organization_name.trim(),
            description: description.trim(),
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


//for updating request details
export const updateOrganizerRequestStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(reqId) || reqId <= 0) {
            return res.status(400).json({
                message: "A valid request id is required"
            });
        }

        if (status !== "APPROVED" && status !== "REJECTED") {
            return res.status(400).json({
                message: "Status must be APPROVED or REJECTED"
            });
        }

        const result = await updateOrgReq(reqId, status);

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

