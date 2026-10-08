import { Request, Response, NextFunction } from "express";
import { getAllOrganisers,
    getOrganiserByUserId,
 } from "../models/organiserModel.js";

import { getEventsByOrganiser } from "../models/eventModel.js";
import { getBookingsByOrganiserId } from "../models/bookingModel.js";

export const getOrganisers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const organisers = await getAllOrganisers();

        res.status(200).json({
            message: "Organisers fetched successfully",
            organisers: organisers
        });

    } catch (err) {
        next(err);
    }
};

export const getMyEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }


        const organiser = await getOrganiserByUserId(userId);

        if (!organiser) {
            return res.status(404).json({
                message: "Organiser profile not found"
            });
        }


        const events = await getEventsByOrganiser(
            organiser.id
        );


        res.status(200).json({
            message: "Organiser events fetched successfully",
            events
        });

    } catch (err) {
        next(err);
    }
};

export const getMyBookings = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const organiser = await getOrganiserByUserId(userId);
        if (!organiser) {
            return res.status(404).json({ message: "Organiser profile not found" });
        }

        const bookings = await getBookingsByOrganiserId(organiser.id);
        return res.status(200).json({
            message: "Organiser bookings fetched successfully",
            bookings
        });
    } catch (err) {
        next(err);
    }
};