import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type EventStatus = 
| "PENDING"
| "APPROVED"
| "REJECTED"
| "COMPLETED"
| "CANCELLED";

//creating a type
type Event = {
    organizer_id: number;
    city_id: number;
    category_id: number;
    name: string;
    image?: string | null;
    slug: string;
    description?: string | null;
    location?: string | null;
    event_date: Date | string;
    time: string;
    price: number;
    capacity: number;
    status: EventStatus;
};

export type UpdateEvent = {
    organizer_id?: number;
    city_id?: number;
    category_id?: number;
    name?: string;
    image?: string | null;
    slug?: string;
    description?: string | null;
    location?: string | null;
    event_date?: Date | string;
    time?: string;
    price?: number;
    capacity?: number;
    status?: EventStatus;
};

type EventRow = RowDataPacket & Event & { id: number };

const createEventSlug = (title: string): string => title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export type EventWithCategory = EventRow & {
    category_name: string | null;
};
export type EventWithCategoryAndCity = EventRow & {
    category_name: string | null;
    city_name: string | null;
};

export type AdminEventRequest = EventWithCategoryAndCity & {
    organiser_name: string | null;
};

export const getEventById = async (
    id: number
): Promise<EventRow[]> => {

    const sql = `
        SELECT *
        FROM events
        WHERE id = ?
    `;

    const [results] = await db.query<EventRow[]>(
        sql,
        [id]
    );

    return results;
};


//getting all events
export const getAllEvents = async (): Promise<EventWithCategory[]> => {
    const sql = `
        SELECT events.*, categories.name AS category_name
        FROM events
        LEFT JOIN categories ON categories.id = events.category_id
        WHERE events.status = 'APPROVED'
        ORDER BY events.event_date ASC
    `;
    const [results] = await db.query<EventWithCategory[]>(sql);
    return results;
};

//get only activities
export const getAllActivities = async(): Promise<EventWithCategory[]> => {
    const sql = `
    SELECT events.*, categories.name AS category_name 
FROM events 
INNER JOIN categories ON categories.id = events.category_id 
WHERE events.status = 'APPROVED' 
  AND categories.id IN (2, 5, 6)
ORDER BY events.event_date ASC
 `;
        const [results] = await db.query<EventWithCategory[]>(sql);
        return results;
}

//get only concerts [music category]
export const getAllConcerts = async(): Promise<EventWithCategory[]> => {
    const sql = `
SELECT events.*, categories.name AS category_name 
FROM events 
INNER JOIN categories ON categories.id = events.category_id 
WHERE events.status = 'APPROVED' 
  AND categories.id IN (1)
ORDER BY events.event_date ASC;
`;
const [results] = await db.query<EventWithCategory[]>(sql);
return results;
}
//get event by slug
export const getEventBySlug = async (slug: string) => {
    const sql = `
        SELECT events.*, categories.name AS category_name
        FROM events
        LEFT JOIN categories ON categories.id = events.category_id
        WHERE events.slug = ?
        AND events.status = 'APPROVED'
    `;

    const [results] = await db.query<EventWithCategory[]>(
        sql,
        [slug]
    );

    return results;
};


//posting a new event
export const createEvent = async (event: Event): Promise<ResultSetHeader> => {
    const sql = `
        INSERT INTO events
        (
            organizer_id,
            city_id,
            category_id,
            name,
            image,
            slug,
            description,
            location,
            event_date,
            time,
            price,
            capacity,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(
        sql,
        [
            event.organizer_id,
            event.city_id,
            event.category_id,
            event.name,
            event.image ?? null,
            event.slug,
            event.description,
            event.location,
            event.event_date,
            event.time,
            event.price,
            event.capacity,
            event.status
        ]
    );

    return result;
};

//updating a event details
export const updateEvent = async (
    id: number,
    event: UpdateEvent
): Promise<ResultSetHeader> => {

    const fields: string[] = [];
    const values: (string | number | Date | null)[] = [];

    if (event.name !== undefined) {
        fields.push("name = ?");
        values.push(event.name);
    }

    if (event.image !== undefined) {
        fields.push("image = ?");
        values.push(event.image);
    }

    if (event.slug !== undefined) {
        fields.push("slug = ?");
        values.push(event.slug);
    }

    if (event.description !== undefined) {
        fields.push("description = ?");
        values.push(event.description);
    }

    if (event.city_id !== undefined) {
        fields.push("city_id = ?");
        values.push(event.city_id);
    }

    if (event.category_id !== undefined) {
        fields.push("category_id = ?");
        values.push(event.category_id);
    }

    if (event.location !== undefined) {
        fields.push("location = ?");
        values.push(event.location);
    }

    if (event.event_date !== undefined) {
        fields.push("event_date = ?");
        values.push(event.event_date);
    }

    if (event.time !== undefined) {
        fields.push("time = ?");
        values.push(event.time);
    }

    if (event.price !== undefined) {
        fields.push("price = ?");
        values.push(event.price);
    }

    if (event.capacity !== undefined) {
        fields.push("capacity = ?");
        values.push(event.capacity);
    }

    if (event.status !== undefined) {
        fields.push("status = ?");
        values.push(event.status);
    }

    if (event.organizer_id !== undefined) {
        fields.push("organizer_id = ?");
        values.push(event.organizer_id);
    }

    if (fields.length === 0) {
        return {
            affectedRows: 0
        } as ResultSetHeader;
    }

    const sql = `
        UPDATE events
        SET ${fields.join(", ")}
        WHERE id = ?
    `;

    values.push(id);

    const [result] = await db.query<ResultSetHeader>(
        sql,
        values
    );

    return result;
};
// Admin: Update event approval status
export const updateEventStatus = async (
    eventId: number,
    status: "APPROVED" | "REJECTED"
): Promise<ResultSetHeader> => {

    const sql = `
        UPDATE events
        SET status = ?
        WHERE id = ?
    `;

    const [result] = await db.execute<ResultSetHeader>(
        sql,
        [status, eventId]
    );

    return result;
};

// Check if a slug already exists
export const checkSlugExists = async (slug: string, excludeId?: number): Promise<boolean> => {
    let sql = `SELECT id FROM events WHERE slug = ?`;
    const params: (string | number)[] = [slug];

    if (excludeId) {
        sql += ` AND id != ?`;
        params.push(excludeId);
    }

    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    return rows.length > 0;
};

export const getEventsByOrganiser = async (
    organiserId: number
): Promise<EventWithCategoryAndCity[]> => {

        const sql = `
        SELECT
            events.id,
            events.organizer_id,
            events.city_id,
            events.category_id,
            events.name,
            events.image,
            events.slug,
            events.description,
            events.location,
            events.event_date,
            events.time,
            events.price,
            events.capacity,
            events.status,
            categories.name AS category_name,
            cities.name AS city_name
        FROM events

        LEFT JOIN categories
            ON categories.id = events.category_id

        LEFT JOIN cities
            ON cities.id = events.city_id

        WHERE events.organizer_id = ?

        ORDER BY events.event_date ASC
    `;

    const [results] = await db.query<EventWithCategoryAndCity[]>(
        sql,
        [organiserId]
    );

    return results;
};

export const getAdminEventRequests = async (): Promise<AdminEventRequest[]> => {
    const sql = `
        SELECT
            events.*,
            categories.name AS category_name,
            cities.name AS city_name,
            organizers.stage_name AS organiser_name
        FROM events
        LEFT JOIN categories ON categories.id = events.category_id
        LEFT JOIN cities ON cities.id = events.city_id
        LEFT JOIN organizers ON organizers.id = events.organizer_id
        ORDER BY
            CASE WHEN events.status = 'PENDING' THEN 0 ELSE 1 END,
            events.event_date ASC,
            events.id DESC
    `;

    const [results] = await db.query<AdminEventRequest[]>(sql);
    return results;
};