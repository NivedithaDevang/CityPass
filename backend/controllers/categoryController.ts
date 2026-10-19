
import { Request, Response, NextFunction } from "express";

import AppError from "../types/appError.js";

import {
  getActiveCategories,
  getAllCategory,
  createCategory,
  updateCategory,
} from "../models/categoryModel.js";

import { validateId } from "../validators/idValidator.js";

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
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      throw new AppError("Category name is required", 400);
    }

    const categoryId = await createCategory(name.trim());

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      categoryId,
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return next(
        new AppError("Category name already exists", 409)
      );
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
  try {

    const id = validateId(req.params.id);

    const { name, is_active } = req.body;


    if (
      is_active !== undefined &&
      typeof is_active !== "boolean" &&
      is_active !== "true" &&
      is_active !== "false" &&
      is_active !== 1 &&
      is_active !== 0
    ) {
      throw new AppError(
        "is_active must be true or false",
        400
      );
    }

    // Validate that at least one field is provided.
    if (name === undefined && is_active === undefined) {
      throw new AppError(
        "At least one field is required to update",
        400
      );
    }

    // Validate category name if provided.
    if (name !== undefined && (
      typeof name !== "string" || !name.trim()
    )) {
      throw new AppError(
        "Category name must be a non-empty string",
        400
      );
    }

    // Convert is_active into a boolean.
    const parsedIsActive =
      is_active !== undefined
        ? is_active === true ||
          is_active === "true" ||
          Number(is_active) === 1
        : undefined;

    const affectedRows = await updateCategory(
      id,
      typeof name === "string" ? name.trim() : undefined,
      parsedIsActive
    );

    if (affectedRows === 0) {
      throw new AppError("Category not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return next(
        new AppError("Category name already exists", 409)
      );
    }

    next(error);
  }
};
