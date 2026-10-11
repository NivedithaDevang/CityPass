import { db } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type Category = RowDataPacket & {
  id: number;
  name: string;
  is_active: boolean;
};

// Public: Only active categories
export const getActiveCategories = async (): Promise<Category[]> => {
  const sql = `
    SELECT id, name, is_active
    FROM categories
    WHERE is_active = TRUE
    ORDER BY name ASC
  `;

  const [results] = await db.query<Category[]>(sql);
  return results;
};

// Admin: All categories (both ACTIVE and INACTIVE)
export const getAllCategory = async (): Promise<Category[]> => {
  const sql = `
    SELECT id, name, is_active
    FROM categories
    ORDER BY id ASC
  `;

  const [results] = await db.query<Category[]>(sql);
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

  const [results] = await db.query<Category[]>(sql, [id]);
  return results[0];
};

// Create category (defaults to TRUE)
export const createCategory = async (name: string): Promise<number> => {
  const sql = `
    INSERT INTO categories (name, is_active)
    VALUES (?, TRUE)
  `;

  const [result] = await db.execute<ResultSetHeader>(sql, [name.trim()]);
  return result.insertId;
};

// Update category (supports name and is_active)
export const updateCategory = async (
  id: number,
  name?: string,
  is_active?: boolean
) => {
  const fields: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name.trim());
  }

  if (is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(is_active);
  }

  if (fields.length === 0) {
    return 0;
  }

  values.push(id);

  const sql = `
    UPDATE categories
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

  const [result]: any = await db.query(sql, values);
  return result.affectedRows;
};