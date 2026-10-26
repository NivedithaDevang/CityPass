import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type EventStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export type Event = {
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
  is_live?: boolean | number;
  languages?: string | string[] | null;
  age_group?: string | null;
  duration_hours?: number | null;
  additional_instructions?: string | null;
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
  is_live?: boolean | number;
  languages?: string | string[] | null;
  age_group?: string | null;
  duration_hours?: number | null;
  additional_instructions?: string | null;
};

type EventRow = RowDataPacket & Event & { id: number };

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

export const getEventById = async (id: number): Promise<EventRow[]> => {
  const sql = `
    SELECT 
      events.*,
      DATE_FORMAT(events.event_date, '%Y-%m-%d') AS event_date
    FROM events
    WHERE events.id = ?
  `;
  const [results] = await db.query<EventRow[]>(sql, [id]);
  return results;
};

export const getEventDateById = async (id: number): Promise<string | null> => {
  const sql = `
    SELECT DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date
    FROM events
    WHERE id = ?
  `;
  const [results] = await db.query<(RowDataPacket & { event_date: string })[]>(
    sql,
    [id]
  );
  return results[0]?.event_date ?? null;
};

export const getAllEvents = async (): Promise<EventWithCategory[]> => {
  const sql = `
    SELECT 
      events.*, 
      DATE_FORMAT(events.event_date, '%Y-%m-%d') AS event_date,
      categories.name AS category_name
    FROM events
    LEFT JOIN categories ON categories.id = events.category_id
    WHERE events.status = 'APPROVED'
      AND (
        events.event_date >= CURDATE()
        OR events.is_live = 1
      )
    ORDER BY events.event_date ASC
  `;
  const [results] = await db.query<EventWithCategory[]>(sql);
  return results;
};

export const getAllActivities = async (): Promise<EventWithCategory[]> => {
  const sql = `
    SELECT 
      events.*, 
      DATE_FORMAT(events.event_date, '%Y-%m-%d') AS event_date,
      categories.name AS category_name 
    FROM events 
    INNER JOIN categories ON categories.id = events.category_id 
    WHERE events.status = 'APPROVED' 
      AND categories.id IN (2, 5, 6)
      AND (
        events.event_date >= CURDATE()
        OR events.is_live = 1
      )
    ORDER BY events.event_date ASC
  `;
  const [results] = await db.query<EventWithCategory[]>(sql);
  return results;
};

export const getAllConcerts = async (): Promise<EventWithCategory[]> => {
  const sql = `
    SELECT 
      events.*, 
      DATE_FORMAT(events.event_date, '%Y-%m-%d') AS event_date,
      categories.name AS category_name 
    FROM events 
    INNER JOIN categories ON categories.id = events.category_id 
    WHERE events.status = 'APPROVED' 
      AND categories.id IN (1)
      AND (
        events.event_date >= CURDATE()
        OR events.is_live = 1
      )
    ORDER BY events.event_date ASC
  `;
  const [results] = await db.query<EventWithCategory[]>(sql);
  return results;
};

export const getEventBySlug = async (slug: string) => {
  const sql = `
    SELECT
      events.*,
      DATE_FORMAT(events.event_date, '%Y-%m-%d') AS event_date,
      categories.name AS category_name,
      cities.name AS city_name,
      organizers.stage_name AS organiser_stage_name,
      users.name AS organiser_user_name
    FROM events
    LEFT JOIN categories ON categories.id = events.category_id
    LEFT JOIN cities ON cities.id = events.city_id
    LEFT JOIN organizers ON organizers.id = events.organizer_id
    LEFT JOIN users ON users.id = organizers.user_id
    WHERE events.slug = ?
      AND events.status = 'APPROVED'
  `;
  const [results] = await db.query<EventWithCategory[]>(sql, [slug]);
  return results;
};

// Insert new event with the 4 added columns
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
      status,
      languages,
      age_group,
      duration_hours,
      additional_instructions
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Standardize JSON for languages
  const languagesValue = event.languages
    ? typeof event.languages === "string"
      ? event.languages.startsWith("[")
        ? event.languages
        : JSON.stringify(event.languages.split(",").map((l) => l.trim()))
      : JSON.stringify(event.languages)
    : null;

  // Clean date string to ensure only 'YYYY-MM-DD' gets saved into the DATE column
  const cleanDate =
    typeof event.event_date === "string"
      ? event.event_date.split("T")[0].split(" ")[0]
      : event.event_date;

  const [result] = await db.query<ResultSetHeader>(sql, [
    event.organizer_id,
    event.city_id,
    event.category_id,
    event.name,
    event.image ?? null,
    event.slug,
    event.description ?? null,
    event.location ?? null,
    cleanDate,
    event.time,
    event.price,
    event.capacity,
    event.status,
    languagesValue,
    event.age_group ?? null,
    event.duration_hours ?? null,
    event.additional_instructions ?? null,
  ]);

  return result;
};

// Update event supporting the 4 added columns
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
    const cleanDate =
      typeof event.event_date === "string"
        ? event.event_date.split("T")[0].split(" ")[0]
        : event.event_date;
    values.push(cleanDate);
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
  if (event.is_live !== undefined) {
    fields.push("is_live = ?");
    values.push(event.is_live ? 1 : 0);
  }
  if (event.organizer_id !== undefined) {
    fields.push("organizer_id = ?");
    values.push(event.organizer_id);
  }
  if (event.languages !== undefined) {
    fields.push("languages = ?");
    const formattedLanguages = event.languages
      ? typeof event.languages === "string"
        ? event.languages.startsWith("[")
          ? event.languages
          : JSON.stringify(event.languages.split(",").map((l) => l.trim()))
        : JSON.stringify(event.languages)
      : null;
    values.push(formattedLanguages);
  }
  if (event.age_group !== undefined) {
    fields.push("age_group = ?");
    values.push(event.age_group);
  }
  if (event.duration_hours !== undefined) {
    fields.push("duration_hours = ?");
    values.push(event.duration_hours);
  }
  if (event.additional_instructions !== undefined) {
    fields.push("additional_instructions = ?");
    values.push(event.additional_instructions);
  }

  if (fields.length === 0) {
    return { affectedRows: 0 } as ResultSetHeader;
  }

  const sql = `
    UPDATE events
    SET ${fields.join(", ")}
    WHERE id = ?
  `;
  values.push(id);

  const [result] = await db.query<ResultSetHeader>(sql, values);
  return result;
};

export const updateEventStatus = async (
  eventId: number,
  status: "APPROVED" | "REJECTED"
): Promise<ResultSetHeader> => {
  const sql = `
    UPDATE events
    SET status = ?
    WHERE id = ?
  `;
  const [result] = await db.execute<ResultSetHeader>(sql, [status, eventId]);
  return result;
};

export const checkSlugExists = async (
  slug: string,
  excludeId?: number
): Promise<boolean> => {
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
      events.*,
      DATE_FORMAT(events.event_date, '%Y-%m-%d') AS event_date,
      categories.name AS category_name,
      cities.name AS city_name
    FROM events
    LEFT JOIN categories ON categories.id = events.category_id
    LEFT JOIN cities ON cities.id = events.city_id
    WHERE events.organizer_id = ?
    ORDER BY events.event_date ASC
  `;
  const [results] = await db.query<EventWithCategoryAndCity[]>(sql, [
    organiserId,
  ]);
  return results;
};

export const hasUpcomingOrganiserEvents = async (
  organiserId: number
): Promise<boolean> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT id
      FROM events
      WHERE organizer_id = ?
        AND status IN ('PENDING', 'APPROVED')
        AND (event_date >= CURRENT_DATE OR is_live = 1)
      LIMIT 1
    `,
    [organiserId]
  );

  return rows.length > 0;
};

export const getAdminEventRequests = async (): Promise<AdminEventRequest[]> => {
  const sql = `
    SELECT
      events.*,
      DATE_FORMAT(events.event_date, '%Y-%m-%d') AS event_date,
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

export const cancelEvent = async (
  eventId: number,
  status: "CANCELLED"
): Promise<ResultSetHeader> => {
  const sql = "UPDATE events SET status = ? WHERE id = ?";
  const [result] = await db.execute<ResultSetHeader>(sql, [status, eventId]);
  return result;
};

export const goLive = async (
  eventId: number,
  isLive: boolean
): Promise<ResultSetHeader> => {
  const sql = "UPDATE events SET is_live = ? WHERE id = ?";
  const [result] = await db.execute<ResultSetHeader>(sql, [
    isLive ? 1 : 0,
    eventId,
  ]);
  return result;
};