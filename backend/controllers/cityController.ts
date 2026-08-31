import { getAllCities,
    getCityById,
    createCity,
    updateCity,
    updateCityStatus
 } from "../models/cityModel.js";
import { Request, response, Response } from "express";

export const getCities = async(
    req : Request,
    res : Response
) => {
    try {
        const cities = await getAllCities();
        res.status(200).json({
            cities
        });

    }
    catch(error){
        res.status(500).json({
            message : "unable to fetch cities"
        });
    };
}


//get cities by id
export const getCity = async(
    req : Request,
    res : Response
) => {
    try{
        const id = Number(req.params.id);
        const city = await getCityById(id);

        if(!city){
            return res.status(404).json({
                message : "City not found"
            });
        }
        res.status(200).json({
            city
        });
    }
    catch(error){
        res.status(500).json({
            message : "Unable to fetch city"
        });
    }
};


//create city
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


//update city
export const editCity = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);
        const { name, description } = req.body;

        const affectedRows = await updateCity(
            id,
            name,
            description
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message: "City not found"
            });
        }

        res.status(200).json({
            message: "City updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to update city"
        });
    }
};


//active or inactive city
export const changeCityStatus = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);
        const { is_active } = req.body;

        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                message: "is_active must be true or false"
            });
        }

        const affectedRows = await updateCityStatus(
            id,
            is_active
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message: "City not found"
            });
        }

        res.status(200).json({
            message: is_active
                ? "City activated successfully"
                : "City deactivated successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to update city status"
        });
    }
};