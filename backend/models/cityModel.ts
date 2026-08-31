import { db } from "../config/env.js";
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
export const updateCity = async (
    id: number,
    name: string,
    description: string
): Promise<number> => {
    const sql = `
        UPDATE cities
        SET name = ?, description = ?
        WHERE id = ?
    `;

    const [result] = await db.execute<ResultSetHeader>(
        sql,
        [name, description, id]
    );

    return result.affectedRows;
};

// Change active/inactive status
export const updateCityStatus = async (
    id: number,
    isActive: boolean
): Promise<number> => {
    const sql = `
        UPDATE cities
        SET is_active = ?
        WHERE id = ?
    `;

    const [result] = await db.execute<ResultSetHeader>(
        sql,
        [isActive, id]
    );

    return result.affectedRows;
};