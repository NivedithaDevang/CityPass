import { Request, Response, NextFunction } from "express";

import {
    createCityAdmin,
    revokeCityAdmin
} from "../models/adminModel.js";


// Create city admin
export const addCityAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            name,
            email,
            password,
            city_id
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            city_id === undefined
        ) {
            return res.status(400).json({
                message: "name, email, password and city_id are required"
            });
        }

        const cityId = Number(city_id);

        if (!Number.isInteger(cityId) || cityId <= 0) {
            return res.status(400).json({
                message: "A valid city id is required"
            });
        }

        const adminId = await createCityAdmin(
            name.trim(),
            email.trim(),
            password,
            cityId
        );

        return res.status(201).json({
            message: "City admin created successfully",
            adminId
        });

    } catch (err) {
        next(err);
    }
};


// Delete / revoke city admin
export const deleteCityAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const adminId = Number(req.params.id);

        if (!Number.isInteger(adminId) || adminId <= 0) {
            return res.status(400).json({
                message: "A valid admin id is required"
            });
        }

        const success = await revokeCityAdmin(adminId);

        if (!success) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        return res.status(200).json({
            message: "City admin deleted successfully"
        });

    } catch (err) {
        next(err);
    }
};