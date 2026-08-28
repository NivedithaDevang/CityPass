import {
    getAllEvents,
    createEvent,
    updateEvent as updateEventModel,
    removeEvent
} from "../models/eventModel.js";
import { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";


//for getting all users

export const getEvents = (req: Request, res: Response) => {
    
    getAllEvents((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch events",
                error: err
            });
        }

        res.status(200).json({
            message: "Events fetched successfully",
            users: results
        });
    });
};

//for posting new event
export const addEvent = async (req: Request, res: Response) => {
    const { organizer_id, city_id, category_id, name, description, location, event_date, price, capacity, status = "PENDING" } = req.body;
     if (organizer_id === undefined || city_id === undefined || category_id === undefined || !name || !event_date || price === undefined || capacity === undefined) {
        return res.status(400).json({
            message: "city_id, category_id, name, event_date, price and capacity are required"
        });
    }

    createEvent(
        { organizer_id, city_id, category_id, name, description, location, event_date, price, capacity, status },
            (err: any, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Unable to create event",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Event created successfully",
                event_id: result?.insertId
            });
        }
    );
};


//for updating event details
export const updateEvent = (req: Request, res: Response) => {
    const eventId = Number(req.params.id);
    const { name, description, city_id, category_id, location, event_date, price, capacity, status } = req.body;

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

    updateEventModel(eventId, {
        name, description, city_id, category_id, location, event_date, price, capacity, status,
        organizer_id: undefined
    }, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to update event"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(200).json({
            message: "Event updated successfully",
            eventId
        });
    });
};

//deleting a event

export const deleteEvent = (req: Request, res: Response) => {
    const eventId = Number(req.params.id);

    removeEvent(eventId, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to delete event"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(200).json({
            message: "Event deleted successfully"
        });
    });
};