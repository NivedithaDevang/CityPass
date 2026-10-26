import { db } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type Category = RowDataPacket & {
  id: number;
  name: string;
  is_active: boolean;
  image?: string;
};

export const getCategoryById = async (
  id: number
): Promise<Category | undefined> => {
  const sql = `
    SELECT id, name, image, is_active
    FROM categories
    WHERE id = ?
  `;

  const [results] = await db.query<Category[]>(sql, [id]);
  return results[0];
};

// Public: Only active categories
export const getActiveCategories = async (): Promise<Category[]> => {
  const sql = `
    SELECT id, name, is_active, image
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
    SELECT id, name, is_active, image
    FROM categories
    ORDER BY id ASC
  `;

  const [results] = await db.query<Category[]>(sql);
  return results;
};

// Create category (defaults to TRUE)
export const createCategory = async (name: string, imageUrl: string | null): Promise<number> => {
  const sql = `
    INSERT INTO categories (name, image, is_active)
    VALUES (?, ?, TRUE)
  `;

  const [result] = await db.execute<ResultSetHeader>(sql, [
    name.trim(),
    imageUrl,
  ]);
  return result.insertId;
};

// Update category (supports name and is_active)
export const updateCategory = async (
  id: number,
  name?: string,
  image?: string,
  is_active?: boolean
) => {
  const fields: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name.trim());
  }
  if (image !== undefined) {
    fields.push("image = ?");
    values.push(image.trim());
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