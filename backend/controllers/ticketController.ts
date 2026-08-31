import {
    getAllTickets,
    createTicket,
} from "../models/ticketModel.js"
import { Request, Response, NextFunction } from "express";


//for getting all tickets
export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const results = await getAllTickets();

        res.status(200).json({
            message: "Tickets fetched successfully",
            passes: results
        });
    } catch (err) {
        next(err);
    }
};

//for posting new ticket
export const addTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { event_id, name, description, price, status = "ACTIVE" } = req.body;
        if (event_id === undefined || !name || price === undefined) {
            return res.status(400).json({
                message: "event_id, name and price are required"
            });
        }

        const result = await createTicket(
            { event_id, name, description, price, status }
        );

        res.status(201).json({
            message: "Ticket created successfully",
            passId: result?.insertId
        });
    } catch (err) {
        next(err);
    }
};
