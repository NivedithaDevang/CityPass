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
        instructions,
        additional_instructions,
        age_group,
        age_restriction,
        duration,
        duration_hours,
        languages
    } = req.body;

    const isPartialUpdate = req.method === "PATCH";

    if (
        !isPartialUpdate && (
            city_id === undefined ||
            category_id === undefined ||
            !name ||
            !event_date ||
            price === undefined ||
            capacity === undefined
        )
    ) {
        return res.status(400).json({
            message:
                "city_id, category_id, name, event_date, price and capacity are required"
        });
    }

    if (city_id !== undefined && (!Number.isInteger(Number(city_id)) || Number(city_id) <= 0)) {
        return res.status(400).json({
            message: "city_id must be a valid positive number"
        });
    }

    if (category_id !== undefined && (!Number.isInteger(Number(category_id)) || Number(category_id) <= 0)) {
        return res.status(400).json({
            message: "category_id must be a valid positive number"
        });
    }

    if (name !== undefined && (typeof name !== "string" || name.trim().length < 3)) {
        return res.status(400).json({
            message: "Event name must contain at least 3 characters"
        });
    }

    if (name !== undefined && name.trim().length > 150) {
        return res.status(400).json({
            message: "Event name cannot exceed 150 characters"
        });
    }

    if (description !== undefined && typeof description !== "string") {
        return res.status(400).json({
            message: "Description must be a string"
        });
    }

    if (location !== undefined && typeof location !== "string") {
        return res.status(400).json({
            message: "Location must be a string"
        });
    }

    if (event_date !== undefined) {
        const eventDate = new Date(event_date);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({
                message: "event_date must be a valid date"
            });
        }
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
        return res.status(400).json({
            message: "Price must be a valid number greater than or equal to 0"
        });
    }

    if (
        capacity !== undefined && (
            !Number.isInteger(Number(capacity)) ||
            Number(capacity) <= 0
        )
    ) {
        return res.status(400).json({
            message: "Capacity must be a positive whole number"
        });
    }

    // Optional fields for instructions, age group, duration & languages
    const instr = additional_instructions ?? instructions;
    if (instr !== undefined && typeof instr !== "string") {
        return res.status(400).json({
            message: "Instructions must be a string"
        });
    }

    const age = age_group ?? age_restriction;
    if (age !== undefined && typeof age !== "string") {
        return res.status(400).json({
            message: "Age restriction must be a string"
        });
    }

    const dur = duration_hours ?? duration;
    if (dur !== undefined && dur !== "") {
        const parsedDur = typeof dur === "number" ? dur : parseFloat(String(dur).replace(/[^0-9.]/g, ""));
        if (isNaN(parsedDur) || parsedDur <= 0) {
            return res.status(400).json({
                message: "Duration must be a positive number of hours"
            });
        }
    }

    if (languages !== undefined) {
        if (typeof languages !== "string" && !Array.isArray(languages)) {
            return res.status(400).json({
                message: "Languages must be a string or array of strings"
            });
        }
    }

    next();
};