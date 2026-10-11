import { db } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type City = RowDataPacket & {
  id: number;
  name: string;
  image?: string;
  description: string;
  is_active: boolean;
};

// Public: Only active cities
export const getActiveCities = async (): Promise<City[]> => {
  const sql = `
    SELECT id, name, image, description, is_active
    FROM cities
    WHERE is_active = TRUE
    ORDER BY name ASC
  `;

  const [results] = await db.query<City[]>(sql);
  return results;
};

// Admin: All cities (both ACTIVE and INACTIVE)
export const getAllCities = async (): Promise<City[]> => {
  const sql = `
    SELECT id, name, image, description, is_active
    FROM cities
    ORDER BY id ASC
  `;

  const [results] = await db.query<City[]>(sql);
  return results;
};

// Get one city
export const getCityById = async (
  id: number
): Promise<City | undefined> => {
  const sql = `
    SELECT id, name, image, description, is_active
    FROM cities
    WHERE id = ?
  `;

  const [results] = await db.query<City[]>(sql, [id]);
  return results[0];
};

// Create city (defaults to TRUE/ACTIVE)
export const createCity = async (
  name: string,
  image: string | null,
  description: string
): Promise<number> => {
  const sql = `
    INSERT INTO cities (name, image, description, is_active)
    VALUES (?, ?, ?, TRUE)
  `;

  const [result] = await db.execute<ResultSetHeader>(sql, [
    name,
    image,
    description,
  ]);

  return result.insertId;
};

// Update city (PATCH-style)
export const updateCity = async (
  id: number,
  name?: string,
  image?: string,
  description?: string,
  is_active?: boolean
) => {
  const fields: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name);
  }

  if (image !== undefined) {
    fields.push("image = ?");
    values.push(image);
  }

  if (description !== undefined) {
    fields.push("description = ?");
    values.push(description);
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
    UPDATE cities
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

  const [result]: any = await db.query(sql, values);
  return result.affectedRows;
};

// Find city by name
export const getCityByName = async (
  name: string
): Promise<City | undefined> => {
  const sql = `
    SELECT id, name, image, description, is_active
    FROM cities
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
  `;

  const [results] = await db.query<City[]>(sql, [name.trim()]);
  return results[0];
};