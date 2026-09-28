import { Request, Response, NextFunction } from "express";
import {
  getAllUsers,
  getAllCategories,
  getAllCities,
  getAllEvents,
  getAllOrganiserRequests,
  getAllOrganisers,
  createCityAdmin,
  revokeCityAdmin,
} from "../models/adminModel.js";

// Helper: superadmin sees everything (null), city admin sees their own city_id
const resolveCityScope = (req: Request): number | null => {
  const user = (req as any).user;
  if (!user || user.role === "superadmin") {
    return null;
  }
  return user.city_id ?? null;
};

// Get all users
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = resolveCityScope(req);
    const users = await getAllUsers(cityId);

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Get all organizer requests
export const getOragniserRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = resolveCityScope(req);
    const requests = await getAllOrganiserRequests(cityId);

    return res.status(200).json({
      message: "Organizer requests fetched successfully",
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// Get all organizers
export const getOrganisers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = resolveCityScope(req);
    const organisers = await getAllOrganisers(cityId);

    return res.status(200).json({
      message: "Organizers fetched successfully",
      organisers,
    });
  } catch (error) {
    next(error);
  }
};

// Get all cities
export const getCities = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await getAllCities();

    return res.status(200).json({
      message: "Cities fetched successfully",
      cities,
    });
  } catch (error) {
    next(error);
  }
};

// Get all categories
export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getAllCategories();

    return res.status(200).json({
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get all events
export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = resolveCityScope(req);
    const events = await getAllEvents(cityId);

    return res.status(200).json({
      message: "Events fetched successfully",
      events,
    });
  } catch (error) {
    next(error);
  }
};

// Add city admin
export const addCityAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, city_id } = req.body;

    if (!name || !email || !password || !city_id) {
      return res.status(400).json({
        message: "Name, email, password, and city_id are required",
      });
    }

    const adminId = await createCityAdmin(name, email, password, Number(city_id));

    return res.status(201).json({
      message: "Created city admin successfully",
      adminId,
    });
  } catch (error: any) {
    if (error.statusCode === 409) {
      return res.status(409).json({ message: error.message });
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    next(error);
  }
};

// Remove city admin
export const deleteCityAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = Number(req.params.id);
    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required in URL parameter" });
    }

    const success = await revokeCityAdmin(adminId);

    if (!success) {
      return res.status(404).json({ message: "Admin user not found or not an admin" });
    }

    return res.status(200).json({
      message: "City admin revoked successfully",
    });
  } catch (error) {
    next(error);
  }
};