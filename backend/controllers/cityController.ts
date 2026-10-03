import {
    getAllCities,
    getCityById,
    createCity,
    updateCity
} from "../models/cityModel.js";

import { Request, Response, NextFunction } from "express";

// Get all cities
export const getCities = async (
    req: Request,
    res: Response
) => {
    try {
        const cities = await getAllCities();

        return res.status(200).json({
            message: "Cities fetched successfully",
            cities
        });

    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch cities"
        });
    }
};


// Get city by ID
export const getCity = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        const city = await getCityById(id);

        if (!city) {
            return res.status(404).json({
                message: "City not found"
            });
        }

        res.status(200).json({
            city
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch city"
        });
    }
};


// Create city
export const addCity = async (
    req: Request,
    res: Response
) => {
    try {
        const { name, description } = req.body;

        const cityId = await createCity(
            name,
            description
        );

        res.status(201).json({
            message: "City created successfully",
            cityId
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to create city"
        });
    }
};


// Update city
export const editCity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      description,
      is_active,
    } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid city ID",
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== "boolean"
    ) {
      return res.status(400).json({
        message:
          "is_active must be true or false",
      });
    }

    if (
      name === undefined &&
      description === undefined &&
      is_active === undefined
    ) {
      return res.status(400).json({
        message:
          "At least one field is required to update",
      });
    }

    const affectedRows =
      await updateCity(
        id,
        name,
        description,
        is_active
      );

    if (affectedRows === 0) {
      return res.status(404).json({
        message: "City not found",
      });
    }

    return res.status(200).json({
      message:
        "City updated successfully",
    });
  } catch (error) {
    next(error);
  }
};