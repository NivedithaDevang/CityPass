import { getAllCategory,
    getCategoryById,
    createCategory,
    updateCategory,
    updateCategoryStatus
 } from "../models/categoryModel.js";
import { Request, response, Response } from "express";

export const getCategories = async(
    req : Request,
    res : Response
) => {
    try {
        const categories = await getAllCategory();
        res.status(200).json({
            categories
        });

    }
    catch(error){
        res.status(500).json({
            message : "unable to fetch categories"
        });
    };
}


//get categories by id
export const getCategory = async(
    req : Request,
    res : Response
) => {
    try{
        const id = Number(req.params.id);
        const category = await getCategoryById(id);

        if(!category){
            return res.status(404).json({
                message : "Category not found"
            });
        }
        res.status(200).json({
            category
        });
    }
    catch(error){
        res.status(500).json({
            message : "Unable to fetch category"
        });
    }
};


//create category
export const addCategory = async (
    req: Request,
    res: Response
) => {
    try {
        const { name } = req.body;

        const categoryId = await createCategory(
            name
        );

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


//update category
export const editCategory = async (
    req: Request,
    res: Response
) => {
    try {
        const id = Number(req.params.id);
        const { name } = req.body;

        const affectedRows = await updateCategory(
            id,
            name
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to update category"
        });
    }
};


//active or inactive category
export const changeCategoryStatus = async (
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

        const affectedRows = await updateCategoryStatus(
            id,
            is_active
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: is_active
                ? "Category activated successfully"
                : "Category deactivated successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to update category status"
        });
    }
};