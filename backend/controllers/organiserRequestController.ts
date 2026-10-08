
import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../config/database.js";

import {
    getAllRequests,
    getOrganizerRequestById,
    getActiveRequestByUserId,
    createRequest
} from "../models/organiserRequestModel.js";

type IdRow = { id: number } & RowDataPacket;


export const getRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const results = await getAllRequests();

        return res.status(200).json({
            message: "Requests fetched successfully",
            requests: results
        });
    } catch (err) {
        next(err);
    }
};


export const getRequestById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid organizer request ID."
            });
        }

        const request = await getOrganizerRequestById(id);

        if (!request) {
            return res.status(404).json({
                message: "Organizer request not found."
            });
        }

        return res.status(200).json({
            message: "Organizer request fetched successfully",
            request
        });
    } catch (err) {
        next(err);
    }
};


export const addRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized: Please log in again."
            });
        }
        const existing = await getActiveRequestByUserId(Number(userId));

        if (existing) {
            return res.status(409).json({
                message:
                    existing.status === "APPROVED"
                        ? "You are already a registered organizer."
                        : "You already have an organizer application pending review."
            });
        }


        const stageName = (
            req.body.organization_name ||
            req.body.stageName ||
            ""
        ).trim();

        const description = (
            req.body.description ||
            ""
        ).trim();

        const categoryIdFromBody = Number(req.body.category_id);
        const cityIdFromBody = Number(req.body.city_id);

        const categoryName = (
            req.body.category ||
            ""
        ).trim();

        const cityName = (
            req.body.city ||
            ""
        ).trim();

        const email = (
            req.body.email ||
            ""
        ).trim();

        const phone = (
            req.body.phone ||
            ""
        ).trim();

        const id_proof = (
            req.body.id_proof ||
            ""
        ).trim().toUpperCase();

        if (
            !stageName ||
            !description ||
            !email ||
            !phone ||
            !id_proof
        ) {
            return res.status(400).json({
                message: "All fields are required. Please fill in every field."
            });
        }

        if (description.length < 10) {
            return res.status(400).json({
                message: "Description must be at least 10 characters long."
            });
        }

        if (description.length > 300) {
            return res.status(400).json({
                message: "Description cannot exceed 300 characters."
            });
        }

        let categoryId: number | null = null;

        if (
            Number.isInteger(categoryIdFromBody) &&
            categoryIdFromBody > 0
        ) {
            categoryId = categoryIdFromBody;
        } else if (categoryName) {
            const categorySql = `
                SELECT id
                FROM categories
                WHERE name = ?
                LIMIT 1
            `;

            const [categoryRows] = await db.query<
                IdRow[]
            >(categorySql, [categoryName]);

            if (categoryRows.length === 0) {
                return res.status(400).json({
                    message: "Selected category does not exist."
                });
            }

            categoryId = categoryRows[0].id;
        }

        if (!categoryId) {
            return res.status(400).json({
                message: "Category is required."
            });
        }

        let cityId: number | null = null;

        if (
            Number.isInteger(cityIdFromBody) &&
            cityIdFromBody > 0
        ) {
            cityId = cityIdFromBody;
        } else if (cityName) {
            const citySql = `
                SELECT id
                FROM cities
                WHERE name = ?
                LIMIT 1
            `;

            const [cityRows] = await db.query<
                IdRow[]
            >(citySql, [cityName]);

            if (cityRows.length === 0) {
                return res.status(400).json({
                    message: "Selected city does not exist."
                });
            }

            cityId = cityRows[0].id;
        }

        if (!cityId) {
            return res.status(400).json({
                message: "City is required."
            });
        }

        const [categoryCheck] = await db.query<
            IdRow[]
        >(
            `
                SELECT id
                FROM categories
                WHERE id = ?
                  AND status = 'ACTIVE'
                LIMIT 1
            `,
            [categoryId]
        );

        if (categoryCheck.length === 0) {
            return res.status(400).json({
                message: "Selected category is inactive or does not exist."
            });
        }

        const [cityCheck] = await db.query<
            IdRow[]
        >(
            `
                SELECT id
                FROM cities
                WHERE id = ?
                  AND status = 'ACTIVE'
                LIMIT 1
            `,
            [cityId]
        );

        if (cityCheck.length === 0) {
            return res.status(400).json({
                message: "Selected city is inactive or does not exist."
            });
        }

        const result = await createRequest({
            user_id: Number(userId),
            organization_name: stageName,
            description,
            category_id: categoryId,
            city_id: cityId,
            id_proof,
            email,
            phone,
            status: "PENDING"
        });

        return res.status(201).json({
            message: "Organizer request submitted successfully!",
            requestId: result.insertId
        });
    } catch (err) {
        next(err);
    }
};
