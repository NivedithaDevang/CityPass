import { Request, Response, NextFunction } from "express";

export const validateEvent = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const {
        city_id,
        category_id,
        name,
        description,
        location,
        event_date,
        price,
        capacity,
        status
    } = req.body;

    // Required fields
    if (
        city_id === undefined ||
        category_id === undefined ||
        !name ||
        !event_date ||
        price === undefined ||
        capacity === undefined
    ) {
        return res.status(400).json({
            message:
                "city_id, category_id, name, event_date, price and capacity are required"
        });
    }

    // Validate city_id
    if (!Number.isInteger(Number(city_id)) || Number(city_id) <= 0) {
        return res.status(400).json({
            message: "city_id must be a valid positive number"
        });
    }

    // Validate category_id
    if (!Number.isInteger(Number(category_id)) || Number(category_id) <= 0) {
        return res.status(400).json({
            message: "category_id must be a valid positive number"
        });
    }

    // Validate name
    if (typeof name !== "string" || name.trim().length < 3) {
        return res.status(400).json({
            message: "Event name must contain at least 3 characters"
        });
    }

    // Validate description
    if (
        description !== undefined &&
        typeof description !== "string"
    ) {
        return res.status(400).json({
            message: "Description must be a string"
        });
    }

    // Validate location
    if (
        location !== undefined &&
        typeof location !== "string"
    ) {
        return res.status(400).json({
            message: "Location must be a string"
        });
    }

    // Validate event date
    const eventDate = new Date(event_date);

    if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
            message: "event_date must be a valid date"
        });
    }

    // Event should be in the future
    if (eventDate <= new Date()) {
        return res.status(400).json({
            message: "Event date must be in the future"
        });
    }

    // Validate price
    if (isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({
            message: "Price must be a valid number greater than or equal to 0"
        });
    }

    // Validate capacity
    if (
        !Number.isInteger(Number(capacity)) ||
        Number(capacity) <= 0
    ) {
        return res.status(400).json({
            message: "Capacity must be a positive whole number"
        });
    }

    // Validate status
    const allowedStatuses = ["PENDING", "APPROVED", "REJECTED"];

    if (
        status !== undefined &&
        !allowedStatuses.includes(status)
    ) {
        return res.status(400).json({
            message: "Invalid event status"
        });
    }

    next();
};