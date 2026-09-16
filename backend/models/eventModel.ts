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

export type EventWithCategory = EventRow & {
    category_name: string | null;
};
export type ConcertWithCategory = EventRow & {
    category_name: string | null;
};


//getting all events
export const getAllEvents = async () => {
    const sql = `
        SELECT events.*, categories.name AS category_name
        FROM events
        LEFT JOIN categories ON categories.id = events.category_id
        WHERE events.status = 'APPROVED'
        ORDER BY events.event_date ASC
    `;
    const [results] = await dbConfig.query<EventWithCategory[]>(sql);
    return results;
};

//get only activities
export const getAllActivities = async() => {
    const sql = `
    SELECT events.*, categories.name AS category_name 
FROM events 
INNER JOIN categories ON categories.id = events.category_id 
WHERE events.status = 'APPROVED' 
  AND categories.id IN (2, 5, 6)
ORDER BY events.event_date ASC
 `;
        const [results] = await dbConfig.query<EventWithCategory[]>(sql);
        return results;
}

//get only concerts [music category]
export const getAllConcerts = async() => {
    const sql = `
SELECT events.*, categories.name AS category_name 
FROM events 
INNER JOIN categories ON categories.id = events.category_id 
WHERE events.status = 'APPROVED' 
  AND categories.id IN (1)
ORDER BY events.event_date ASC;
`;
const [results] = await dbConfig.query<ConcertWithCategory[]>(sql);
return results;
}


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

