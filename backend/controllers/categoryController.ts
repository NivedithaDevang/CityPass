import {
    getAllCategory,
    getCategoryById,
    createCategory,
    updateCategory
} from "../models/categoryModel.js";

import { Request, Response, NextFunction } from "express";


// Get all categories
export const getCategories = async (
    req: Request,
    res: Response
) => {
    try {
        const categories = await getAllCategory();

        res.status(200).json({
            message: "Categories fetched successfully",
            categories
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch categories"
        });
    }
};


// Get category by ID
export const getCategory = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        const category = await getCategoryById(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category fetched successfully",
            category
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch category"
        });
    }
};


// Create category
export const addCategory = async (
    req: Request,
    res: Response
) => {
    try {
        const { name } = req.body;

        const categoryId = await createCategory(name);

        res.status(201).json({
            message: "Category created successfully",
            categoryId
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to create category"
        });
    }
};


// Update category
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
      typeof is_active !== "boolean"
    ) {
      return res.status(400).json({
        message: "is_active must be true or false",
      });
    }

    if (
      name === undefined &&
      is_active === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    const affectedRows = await updateCategory(
      id,
      name,
      is_active
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