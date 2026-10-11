import {
  getActiveCategories,
  getAllCategory,
  getCategoryById,
  createCategory,
  updateCategory,
} from "../models/categoryModel.js";

import { Request, Response, NextFunction } from "express";

// Public: GET /v1/categories (Only active categories)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getActiveCategories();

    return res.status(200).json({
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch categories",
    });
  }
};

// Admin: GET /v1/admin/categories (All categories)
export const getAdminCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategory();

    return res.status(200).json({
      message: "Admin categories fetched successfully",
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch categories",
    });
  }
};

// Get category by ID
export const getCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch category",
    });
  }
};

// Admin: Create category
export const addCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const categoryId = await createCategory(name.trim());

    return res.status(201).json({
      message: "Category created successfully",
      categoryId,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create category",
    });
  }
};

// Admin: Update category
export const editCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { name, is_active } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
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

    if (name === undefined && is_active === undefined) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    const parsedIsActive =
      is_active !== undefined
        ? is_active === true || is_active === "true" || Number(is_active) === 1
        : undefined;

    const affectedRows = await updateCategory(
      id,
      typeof name === "string" ? name.trim() : undefined,
      parsedIsActive
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      message: "Category updated successfully",
    });
  } catch (error) {
    next(error);
  }
};