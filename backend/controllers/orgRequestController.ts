import { getAllRequests,
    createRequest, 
    updateRequest as updateOrgReq, 
    removeRequest } 
    from "../models/orgRequestModel.js";
import { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";


//for getting all requests

export const getRequests = (req: Request, res: Response) => {
    getAllRequests((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch organizer requests",
                error: err
            });
        }

        res.status(200).json({
            message: "Requests fetched successfully",
            requests: results
        });
    });
};

//for posting new request
export const addRequest = (req: Request, res: Response) => {
    createRequest(req.body, (err: any, result: any) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to create request"
            });
        }

        res.status(201).json({
            message: "Request created successfully",
            requestId: result.insertId
        });
    });
};


//for updating request details
export const updateRequest = (req: Request, res: Response) => {
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

    updateOrgReq(reqId, { user_id, organization_name, description, status }, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to update request"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        res.status(200).json({
            message: "Request updated successfully",
            reqId
        });
    });
};

//deleting a user

export const deleteRequest = (req: Request, res: Response) => {
    const reqId = Number(req.params.id);

    removeRequest(reqId, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to delete request"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        res.status(200).json({
            message: "Request deleted successfully"
        });
    });
};