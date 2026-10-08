import { db } from "../config/database.js";
import { RowDataPacket } from "mysql2/promise";


export type Organiser = RowDataPacket & {
    id: number;
    user_id: number | null;
    description: string | null;
    email: string | null;
    stage_name: string | null;
};


export const getAllOrganisers = async (): Promise<Organiser[]> => {

    const sql = `
        SELECT
            id,
            user_id,
            description,
            email,
            stage_name
        FROM organizers
        ORDER BY id DESC
    `;

    const [results] =
        await db.query<Organiser[]>(sql);

    return results;
};


export const getOrganiserByUserId = async (
    userId: number
): Promise<Organiser | null> => {

    const sql = `
        SELECT
            id,
            user_id,
            description,
            email,
            stage_name
        FROM organizers
        WHERE user_id = ?
        LIMIT 1
    `;

    const [results] =
        await db.query<Organiser[]>(
            sql,
            [userId]
        );

    return results.length > 0
        ? results[0]
        : null;
};