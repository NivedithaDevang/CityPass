
import { Request, Response, NextFunction } from "express";
import { validateId } from "./idValidator.js";

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
        duration_hours,
        languages,
    } = req.body;

    const isPartialUpdate = req.method === "PATCH";

    if (
        !isPartialUpdate &&
        (
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
                "city_id, category_id, name, event_date, price and capacity are required",
        });
    }

    try {
        if (city_id !== undefined) {
            req.body.city_id = validateId(city_id);
        }

        if (category_id !== undefined) {
            req.body.category_id = validateId(category_id);
        }
    } catch (error) {
        return next(error);
    }

    if (name !== undefined) {
        if (
            typeof name !== "string" ||
            name.trim().length === 0
        ) {
            return res.status(400).json({
                message:
                    "Event name cannot be empty or contain only spaces",
            });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({
                message: "Event name must contain at least 3 characters",
            });
        }

        if (name.trim().length > 150) {
            return res.status(400).json({
                message: "Event name cannot exceed 150 characters",
            });
        }

        req.body.name = name.trim();
    }

    if (description !== undefined) {
        if (
            typeof description !== "string" ||
            description.trim().length === 0
        ) {
            return res.status(400).json({
                message:
                    "Description cannot be empty or contain only spaces",
            });
        }

        req.body.description = description.trim();
    }

    if (location !== undefined) {
        if (
            typeof location !== "string" ||
            location.trim().length === 0
        ) {
            return res.status(400).json({
                message:
                    "Location cannot be empty or contain only spaces",
            });
        }

        req.body.location = location.trim();
    }

    if (event_date !== undefined) {
        const eventDate = new Date(event_date);

        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({
                message: "event_date must be a valid date",
            });
        }
    }

    if (
        price !== undefined &&
        (
            price === "" ||
            (typeof price !== "string" &&
                typeof price !== "number") ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        )
    ) {
        return res.status(400).json({
            message:
                "Price must be a valid number greater than or equal to 0",
        });
    }

    if (
        capacity !== undefined &&
        (
            capacity === "" ||
            (typeof capacity !== "string" &&
                typeof capacity !== "number") ||
            !Number.isSafeInteger(Number(capacity)) ||
            Number(capacity) <= 0
        )
    ) {
        return res.status(400).json({
            message: "Please enter a valid number of attendees (minimum 1).",
        });
    }

    const instr = additional_instructions ?? instructions;

    if (instr !== undefined && typeof instr !== "string") {
        return res.status(400).json({
            message: "Instructions must be a string",
        });
    }

    if (typeof instr === "string") {
        const trimmedInstructions = instr.trim();

        if (additional_instructions !== undefined) {
            req.body.additional_instructions = trimmedInstructions;
        } else {
            req.body.instructions = trimmedInstructions;
        }
    }

    const age = age_group ?? age_restriction;

    if (age !== undefined && typeof age !== "string") {
        return res.status(400).json({
            message: "Age restriction must be a string",
        });
    }

    const dur = duration_hours;

    if (dur !== undefined && dur !== "") {
        const parsedDur =
            typeof dur === "number"
                ? dur
                : parseFloat(
                    String(dur).replace(/[^0-9.]/g, "")
                );

        if (
            !Number.isFinite(parsedDur) ||
            parsedDur <= 0
        ) {
            return res.status(400).json({
                message:
                    "Duration must be a positive number of hours",
            });
        }
    }

    if (languages !== undefined) {
        if (
            typeof languages !== "string" &&
            !Array.isArray(languages)
        ) {
            return res.status(400).json({
                message:
                    "Languages must be a string or array of strings",
            });
        }

        if (
            Array.isArray(languages) &&
            !languages.every(
                (language) =>
                    typeof language === "string" &&
                    language.trim().length > 0
            )
        ) {
            return res.status(400).json({
                message:
                    "Each language must be a non-empty string",
            });
        }

        if (typeof languages === "string") {
            if (languages.trim().length === 0) {
                return res.status(400).json({
                    message: "Languages cannot be empty or contain only spaces",
                });
            }

            req.body.languages = languages.trim();
        } else {
            req.body.languages = languages.map(
                (language: string) => language.trim()
            );
        }
    }

    next();
};
