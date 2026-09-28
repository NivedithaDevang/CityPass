import { db } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type City = RowDataPacket & {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
};

// Get all cities
export const getAllCities = async (): Promise<City[]> => {
    const sql = `
        SELECT id, name, description, is_active
        FROM cities
    `;

    const [results] = await db.query<City[]>(sql);

    return results;
};

// Get one city
export const getCityById = async (
    id: number
): Promise<City | undefined> => {
    const sql = `
        SELECT id, name, description, is_active
        FROM cities
        WHERE id = ?
    `;

    const [results] = await db.query<City[]>(sql, [id]);

    return results[0];
};

// Create city
export const createCity = async (
    name: string,
    description: string
): Promise<number> => {
    const sql = `
        INSERT INTO cities (name, description, is_active)
        VALUES (?, ?, TRUE)
    `;

    const [result] = await db.execute<ResultSetHeader>(
        sql,
        [name, description]
    );

    return result.insertId;
};

// Update city
// All fields are optional because this is a PATCH-style update
export const updateCity = async (
    id: number,
    name?: string,
    description?: string,
    isActive?: boolean
): Promise<number> => {

    const updates: string[] = [];
    const values: (string | boolean | number)[] = [];

    // Update name only if it was provided
    if (name !== undefined) {
        updates.push("name = ?");
        values.push(name);
    }

    // Update description only if it was provided
    if (description !== undefined) {
        updates.push("description = ?");
        values.push(description);
    }

    // Update status only if it was provided
    if (isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(isActive);
    }

    // Nothing was provided to update
    if (updates.length === 0) {
        return 0;
    }

    const sql = `
        UPDATE cities
        SET ${updates.join(", ")}
        WHERE id = ?
    `;

    values.push(id);

    const [result] = await db.execute<ResultSetHeader>(
        sql,
        values
    );

    return result.affectedRows;
};

// Find city by name
// Used to check for duplicate city names
export const getCityByName = async (
    name: string
): Promise<City | undefined> => {

    const sql = `
        SELECT id, name, description, is_active
        FROM cities
        WHERE LOWER(name) = LOWER(?)
        LIMIT 1
    `;

    const [results] = await db.query<City[]>(
        sql,
        [name.trim()]
    );

    return results[0];
};