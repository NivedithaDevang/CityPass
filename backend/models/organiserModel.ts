import { db } from "../config/database.js";
import { RowDataPacket } from "mysql2/promise";

export type Organiser = RowDataPacket & {
    id: number;
    description: string | null;
    email: string | null;
    stage_name: string | null;
};

// Get all organisers
export const getAllOrganisers = async (): Promise<Organiser[]> => {
    const sql = `
        SELECT
            id,
            description,
            email,
            stage_name
        FROM organizers
        ORDER BY id DESC
    `;

    const [results] = await db.query<Organiser[]>(sql);

    return results;
};