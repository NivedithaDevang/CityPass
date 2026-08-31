import {
    getAllEvents,
    createEvent,
    updateEvent as updateEventModel
} from "../models/eventModel.js";
import { Request, Response, NextFunction } from "express";


//for getting all events
export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const results = await getAllEvents();

        res.status(200).json({
            message: "Events fetched successfully",
            events: results
        });
    } catch (err) {
        next(err);
    }
};

//for posting new event
export const addEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { organizer_id, city_id, category_id, name, description, location, event_date, price, capacity, status = "PENDING" } = req.body;
        if (organizer_id === undefined || city_id === undefined || category_id === undefined || !name || !event_date || price === undefined || capacity === undefined) {
            return res.status(400).json({
                message: "city_id, category_id, name, event_date, price and capacity are required"
            });
        }

        const result = await createEvent(
            { organizer_id, city_id, category_id, name, description, location, event_date, price, capacity, status }
        );

        res.status(201).json({
            message: "Event created successfully",
            event_id: result?.insertId
        });
    } catch (err) {
        next(err);
    }
};


//for updating event details
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventId = Number(req.params.id);
        const { organizer_id, name, description, city_id, category_id, location, event_date, price, capacity, status } = req.body;

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                message: "A valid event id is required"
            });
        }

        if (!name || city_id === undefined || category_id === undefined || !event_date || price === undefined || capacity === undefined || !status) {
            return res.status(400).json({
                message: "Name, city_id, category_id, event_date, price, capacity and status are required"
            });
        }

        const result = await updateEventModel(eventId, {
            name, description, city_id, category_id, location, event_date, price, capacity, status,
            organizer_id: organizer_id || 0
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(200).json({
            message: "Event updated successfully",
            eventId
        });
    } catch (err) {
        next(err);
    }
};
