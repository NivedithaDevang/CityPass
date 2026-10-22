import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";


export type Organiser = RowDataPacket & {
    id: number;
    user_id: number | null;
    description: string | null;
    email: string | null;
    stage_name: string | null;
};

export type OrganiserAuthRow = RowDataPacket & {
    id : number;
    email : string;
    role : "ORGANIZER";
    status : "ACTIVE" | "INACTIVE" | "SUSPENDED";
    token_version: number;
}


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

export const deactivateOrganiser = async(
    id: number
) : Promise<ResultSetHeader> => {
    const sql =
        `UPDATE organizers SET status = "INACTIVE" , deactivated_at = NOW(), token_version = token_version + 1
        WHERE id = ?
          AND status = "ACTIVE"
          AND NOT EXISTS (
            SELECT 1
            FROM events
            WHERE events.organizer_id = organizers.id
              AND events.status IN ('PENDING', 'APPROVED')
              AND (events.event_date >= CURRENT_DATE OR events.is_live = 1)
          )`;

        const [result] = await db.query<ResultSetHeader>(sql, [id] );
        return result;
};
