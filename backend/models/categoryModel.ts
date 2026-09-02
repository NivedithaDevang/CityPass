import { dbConfig } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type Category = RowDataPacket & {
    id: number;
    name: string;
    is_active: boolean;
};

// Get all categories
export const getAllCategory = async (): Promise<Category[]> => {
    const sql = `
        SELECT id, name, is_active
        FROM categories
    `;

    const [results] = await dbConfig.query<Category[]>(sql);

    return results;
};

// Get one category
export const getCategoryById = async (
    id: number
): Promise<Category | undefined> => {
    const sql = `
        SELECT id, name, is_active
        FROM categories
        WHERE id = ?
    `;

    const [results] = await dbConfig.query<Category[]>(sql, [id]);

    return results[0];
};

// Create category
export const createCategory = async (
    name: string
): Promise<number> => {
    const sql = `
        INSERT INTO categories (name, is_active)
        VALUES (?, TRUE)
    `;

    const [result] = await dbConfig.execute<ResultSetHeader>(
        sql,
        [name]
    );

    return result.insertId;
};

// Update category
export const updateCategory = async (
    id: number,
    name: string,
): Promise<number> => {
    const sql = `
        UPDATE categories
        SET name = ? 
        WHERE id = ?
    `;

    const [result] = await dbConfig.execute<ResultSetHeader>(
        sql,
        [name, id]
    );

    return result.affectedRows;
};

// Change active/inactive status
export const updateCategoryStatus = async (
    id: number,
    isActive: boolean
): Promise<number> => {
    const sql = `
        UPDATE categories
        SET is_active = ?
        WHERE id = ?
    `;

    const [result] = await dbConfig.execute<ResultSetHeader>(
        sql,
        [isActive, id]
    );

    return result.affectedRows;
};