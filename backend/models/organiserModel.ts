import { db } from "../config/database.js";
import { RowDataPacket } from "mysql2/promise";

export type Organiser = RowDataPacket & {
    id: number;
    user_id: number | null;
    description: string | null;
    email: string | null;
    stage_name: string | null;
};

export type OrganiserEvent = RowDataPacket & {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    event_date: string;
    price: number;
    capacity: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    slug: string;
    category_name: string | null;
    city_name: string | null;
};



// Get all organisers
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

    const [results] = await db.query<Organiser[]>(sql);

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

    const [results] = await db.query<Organiser[]>(
        sql,
        [userId]
    );

    return results.length > 0 ? results[0] : null;
};

export const getOrganiserEvents = async (
    organiserId: number
): Promise<OrganiserEvent[]> => {

    const sql = `
        SELECT
            events.id,
            events.name,
            events.description,
            events.location,
            events.event_date,
            events.price,
            events.capacity,
            events.status,
            events.slug,
            categories.name AS category_name,
            cities.name AS city_name

        FROM events

        LEFT JOIN categories
            ON categories.id = events.category_id

        LEFT JOIN cities
            ON cities.id = events.city_id

        WHERE events.organizer_id = ?

        ORDER BY events.event_date DESC
    `;

    const [results] = await db.query<OrganiserEvent[]>(
        sql,
        [organiserId]
    );

    return results;
};