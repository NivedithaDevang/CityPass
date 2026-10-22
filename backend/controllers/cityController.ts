import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import AppError from "../types/appError.js";
import {
  getActiveCities,
  getAllCities,
  getCityById,
  createCity,
  updateCity,
} from "../models/cityModel.js";
import { validateId } from "../validators/idValidator.js";

// Public: GET /v1/cities (returns only active cities)
export const getCities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cities = await getActiveCities();

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      cities,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET /v1/admin/cities (returns all cities)
export const getAdminCities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cities = await getAllCities();

    return res.status(200).json({
      success: true,
      message: "Admin cities fetched successfully",
      cities,
    });
  } catch (error) {
    next(error);
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
      throw new AppError("City name is required", 400);
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
              return reject(new AppError("Cloudinary upload failed", 502));
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
      success: true,
      message: "City created successfully",
      cityId,
      image: imageUrl,
    });
  } catch (error: any) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "image",
        });
      } catch (cleanupErr) {
        console.error("Failed to cleanup Cloudinary upload:", cleanupErr);
      }
    }

    if (error.code === "ER_DUP_ENTRY") {
      return next(new AppError("A city with this name already exists", 409));
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
    const id = validateId(req.params.id);
    const { name, description, is_active } = req.body;
    const imageFile = req.file;

    if (
      is_active !== undefined &&
      typeof is_active !== "boolean" &&
      is_active !== "true" &&
      is_active !== "false" &&
      is_active !== 1 &&
      is_active !== 0
    ) {
      throw new AppError("is_active must be true or false", 400);
    }

    if (
      name === undefined &&
      description === undefined &&
      is_active === undefined &&
      !imageFile
    ) {
      throw new AppError("At least one field is required to update", 400);
    }

    const existingCity = await getCityById(id);
    if (!existingCity) {
      throw new AppError("City not found", 404);
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
              return reject(new AppError("Cloudinary upload failed", 502));
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

    const parsedIsActive =
      is_active !== undefined
        ? is_active === true || is_active === "true" || Number(is_active) === 1
        : undefined;

    const affectedRows = await updateCity(
  id,
  name !== undefined ? name.trim() : undefined,
  newImageUrl,
  description !== undefined ? description.trim() : undefined,
  parsedIsActive
);

    if (affectedRows === 0) {
      throw new AppError("City not found", 404);
    }

    // Clean up previous image from Cloudinary if replacing with a new one
    if (imageFile && existingCity.image) {
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
      success: true,
      message: "City updated successfully",
      image: newImageUrl || undefined,
    });
  } catch (err: any) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "image",
        });
      } catch {
        // ignore cleanup failures
      }
    }

    if (err.code === "ER_DUP_ENTRY") {
      return next(new AppError("A city with this name already exists", 409));
    }

    next(err);
  }
};