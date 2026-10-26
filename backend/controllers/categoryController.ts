import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import AppError from "../types/appError.js";

import {
  getActiveCategories,
  getAllCategory,
  createCategory,
  updateCategory,
  getCategoryById,
} from "../models/categoryModel.js";

import { validateId } from "../validators/idValidator.js";

const uploadCategoryImage = (
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> => {
  const missingConfig = [
    ["CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME],
    ["CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY],
    ["CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingConfig.length > 0) {
    throw new AppError(
      `Cloudinary is not configured. Missing: ${missingConfig.join(", ")}`,
      503
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "citypass/category", resource_type: "image" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary category image upload failed:", error.message);
          reject(new AppError(`Cloudinary upload failed: ${error.message}`, 502));
          return;
        }

        if (!result) {
          reject(new AppError("Cloudinary returned no image upload result", 502));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

// Public: GET /v1/categories (Only active categories)
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getActiveCategories();

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET /v1/admin/categories (All categories)
export const getAdminCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getAllCategory();

    return res.status(200).json({
      success: true,
      message: "Admin categories fetched successfully",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create category
export const addCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let uploadedPublicId: string | null = null;
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      throw new AppError("Category name is required", 400);
    }

    let imageUrl: string | null = null;
    if (req.file) {
      const uploadResult = await uploadCategoryImage(req.file.buffer);
      imageUrl = uploadResult.secure_url;
      uploadedPublicId = uploadResult.public_id;
    }

    const categoryId = await createCategory(name.trim(), imageUrl);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      categoryId,
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
      return next(new AppError("Category name already exists", 409));
    }

    next(error);
  }
};

// Admin: Update category
export const editCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let uploadedPublicId: string | null = null;
  try {
    const id = validateId(req.params.id);
    const imageFile = req.file;
    const { name, is_active } = req.body;

    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    if (name === undefined && is_active === undefined && !imageFile) {
      throw new AppError("At least one field is required to update", 400);
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      throw new AppError("Category name must be a non-empty string", 400);
    }

    let parsedIsActive: boolean | undefined = undefined;
    if (is_active !== undefined) {
      if (
        is_active === true ||
        is_active === "true" ||
        is_active === 1 ||
        is_active === "1"
      ) {
        parsedIsActive = true;
      } else if (
        is_active === false ||
        is_active === "false" ||
        is_active === 0 ||
        is_active === "0"
      ) {
        parsedIsActive = false;
      } else {
        throw new AppError("is_active must be a valid boolean or string", 400);
      }
    }

    let newImageUrl: string | undefined;
    if (imageFile) {
      const uploadResult = await uploadCategoryImage(imageFile.buffer);

      newImageUrl = uploadResult.secure_url;
      uploadedPublicId = uploadResult.public_id;
    }

    await updateCategory(
      id,
      typeof name === "string" ? name.trim() : undefined,
      newImageUrl,
      parsedIsActive
    );

    // Clean up old image from Cloudinary if new image uploaded
    if (imageFile && existingCategory.image) {
      const oldImageUrl = existingCategory.image;
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
      message: "Category updated successfully",
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
      return next(new AppError("Category name already exists", 409));
    }

    next(error);
  }
};