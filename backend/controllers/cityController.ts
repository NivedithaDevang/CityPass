import {
  getActiveCities,
  getAllCities,
  getCityById,
  createCity,
  updateCity,
} from "../models/cityModel.js";
import cloudinary from "../config/cloudinary.js";
import { Request, Response, NextFunction } from "express";

// Public: GET /v1/cities (returns only active cities)
export const getCities = async (req: Request, res: Response) => {
  try {
    const cities = await getActiveCities();

    return res.status(200).json({
      message: "Cities fetched successfully",
      cities,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch cities",
    });
  }
};

// Admin: GET /v1/admin/cities (returns all cities)
export const getAdminCities = async (req: Request, res: Response) => {
  try {
    const cities = await getAllCities();

    return res.status(200).json({
      message: "Admin cities fetched successfully",
      cities,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch cities",
    });
  }
};

// Get single city by ID
export const getCity = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const city = await getCityById(id);

    if (!city) {
      return res.status(404).json({
        message: "City not found",
      });
    }

    return res.status(200).json({
      city,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch city",
    });
  }
};

// Admin: Create city
export const addCity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let uploadedPublicId: string | null = null;
  try {
    const { name, description } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "City name is required" });
    }

    let imageUrl: string | null = null;
    if (req.file) {
      const uploadResult = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "citypass/city", resource_type: "image" },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Cloudinary upload failed"));
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );
        uploadStream.end(req.file!.buffer);
      });
      imageUrl = uploadResult.secure_url;
      uploadedPublicId = uploadResult.public_id;
    }

    const cityId = await createCity(
      name.trim(),
      imageUrl,
      typeof description === "string" ? description.trim() : ""
    );

    return res.status(201).json({
      message: "City created successfully",
      cityId,
      image: imageUrl,
    });
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "image",
        });
      } catch {
        return res.status(500).json({
          message: "Unable to create city",
        });
      }
    }
    next(error);
  }
};

// Admin: Update city (status, details, and optional image)
export const editCity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let uploadedPublicId: string | null = null;
  try {
    const id = Number(req.params.id);
    const { name, description, is_active } = req.body;
    const imageFile = req.file;

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid city ID",
      });
    }

    let newImageUrl: string | undefined;
    if (imageFile) {
      const uploadResult = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "citypass/city",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Cloudinary upload failed"));
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );

        uploadStream.end(imageFile.buffer);
      });

      newImageUrl = uploadResult.secure_url;
      uploadedPublicId = uploadResult.public_id;
    }

    if (
      is_active !== undefined &&
      typeof is_active !== "boolean" &&
      is_active !== "true" &&
      is_active !== "false" &&
      is_active !== 1 &&
      is_active !== 0
    ) {
      return res.status(400).json({
        message: "is_active must be true or false",
      });
    }

    const parsedIsActive =
      is_active !== undefined
        ? is_active === true || is_active === "true" || Number(is_active) === 1
        : undefined;

    if (
      name === undefined &&
      description === undefined &&
      is_active === undefined &&
      !imageFile
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    const existingCity = await getCityById(id);

    const affectedRows = await updateCity(
      id,
      name !== undefined ? String(name).trim() : undefined,
      newImageUrl,
      description !== undefined ? String(description).trim() : undefined,
      parsedIsActive
    );

    if (affectedRows === 0) {
      if (uploadedPublicId) {
        try {
          await cloudinary.uploader.destroy(uploadedPublicId, {
            resource_type: "image",
          });
        } catch {
          // ignore cleanup failures
        }
      }

      return res.status(404).json({
        message: "City not found",
      });
    }

    // Clean up previous image from Cloudinary if replacing with a new one
    if (imageFile && existingCity?.image) {
      const oldImageUrl = existingCity.image;
      try {
        const uploadIndex = oldImageUrl.indexOf("/upload/");
        if (uploadIndex !== -1) {
          let publicId = oldImageUrl.substring(uploadIndex + 8);
          publicId = publicId.replace(/^v\d+\//, "");
          publicId = publicId.replace(/\.[^/.]+$/, "");

          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
        }
      } catch {
        // ignore cleanup failures
      }
    }

    return res.status(200).json({
      message: "City updated successfully",
      image: newImageUrl || undefined,
    });
  } catch (err) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "image",
        });
      } catch {
        // ignore cleanup failures
      }
    }
    next(err);
  }
};