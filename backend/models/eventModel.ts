import { dbConfig } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";


//creating a type
type Event = {
    organizer_id: number;
    city_id: number;
    category_id: number;
    name: string;
    description?: string;
    location?: string;
    event_date: Date;
    price: number;
    capacity: number;
    status: string;
};

type EventRow = RowDataPacket & Event & { id: number };


//getting all events
export const getAllEvents = async () => {
    const [results] = await dbConfig.query<EventRow[]>("SELECT * FROM events");
    return results;
};

//posting a new event
export const createEvent = async (event: Event) => {
    const sql = `
        INSERT INTO events (organizer_id, city_id, category_id, name, description, location, event_date, price, capacity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [results] = await dbConfig.query<ResultSetHeader>(
        sql,
        [ event.organizer_id, event.city_id, event.category_id, event.name, event.description, event.location, event.event_date, event.price, event.capacity, event.status]
    );
    return results;
};

//updating a event details
export const updateEvent = async (id: number, event: Event) => {
    const sql = `
        UPDATE events
        SET name = ?, description = ?, city_id = ?, category_id = ?, location = ?, event_date = ?, price = ?, capacity = ?, status = ?
        WHERE id = ?
    `;

    const [results] = await dbConfig.query<ResultSetHeader>(
        sql,
        [event.name, event.description, event.city_id, event.category_id, event.location, event.event_date, event.price, event.capacity, event.status, id]
    );
    return results;
};

