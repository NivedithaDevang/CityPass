import { getAllRequests,
    createRequest, 
    updateRequest as updateOrgReq
     } 
    from "../models/orgRequestModel.js";
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
        const result = await createRequest(req.body);

        res.status(201).json({
            message: "Request created successfully",
            requestId: result.insertId
        });
    } catch (err) {
        next(err);
    }
};


//for updating request details
export const updateRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reqId = Number(req.params.id);
        const { user_id, organization_name, description, status } = req.body;

        if (!Number.isInteger(reqId) || reqId <= 0) {
            return res.status(400).json({
                message: "A valid request id is required"
            });
        }

        if (!user_id || !organization_name || !description || !status) {
            return res.status(400).json({
                message: "organization_name, user_id, description, and status are required"
            });
        }

        const result = await updateOrgReq(reqId, { user_id, organization_name, description, status });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        res.status(200).json({
            message: "Request updated successfully",
            reqId
        });
    } catch (err) {
        next(err);
    }
};

