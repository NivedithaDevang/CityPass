
import { db } from "../config/database.js";
import {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

export type EventTicket = RowDataPacket & {
  id: number;
  event_id: number;
  ticket_id: number | null;
  name: string;
  description: string | null;
  price: number;
  status: "ACTIVE" | "DELETED";
};

export type TicketTemplate = RowDataPacket & {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
};

// Get active admin templates for an event's category
export const getTemplatesByEventCategory = async (
  eventId: number
): Promise<TicketTemplate[]> => {
  const sql = `
    SELECT
      t.id,
      t.name,
      t.description,
      t.price,
      t.category
    FROM tickets t
    INNER JOIN categories c
      ON LOWER(TRIM(c.name)) = LOWER(TRIM(t.category))
    INNER JOIN events e
      ON e.category_id = c.id
    WHERE e.id = ?
      AND t.status = 'ACTIVE'
    ORDER BY t.id DESC
  `;

  const [rows] = await db.query<TicketTemplate[]>(
    sql,
    [eventId]
  );

  return rows;
};

// Get tickets assigned to a specific event
export const getEventTickets = async (
  eventId: number
): Promise<EventTicket[]> => {
  const sql = `
    SELECT
      id,
      event_id,
      ticket_id,
      name,
      description,
      price,
      status
    FROM event_tickets
    WHERE event_id = ?
      AND status = 'ACTIVE'
    ORDER BY id ASC
  `;

  const [rows] = await db.query<EventTicket[]>(
    sql,
    [eventId]
  );

  return rows;
};

// Add a custom ticket for an event
export const createCustomEventTicket = async (
  eventId: number,
  name: string,
  description: string | null,
  price: number
): Promise<ResultSetHeader> => {
  const sql = `
    INSERT INTO event_tickets (
      event_id,
      ticket_id,
      name,
      description,
      price,
      status
    )
    VALUES (?, NULL, ?, ?, ?, 'ACTIVE')
  `;

  const [result] = await db.execute<ResultSetHeader>(
    sql,
    [eventId, name, description, price]
  );

  return result;
};

// Assign an admin template to an event.
// Copy the template's current details into the event.
export const assignTemplateToEvent = async (
  eventId: number,
  templateId: number
): Promise<ResultSetHeader> => {
  const sql = `
    INSERT INTO event_tickets (
      event_id,
      ticket_id,
      name,
      description,
      price,
      status
    )
    SELECT
      ?,
      t.id,
      t.name,
      t.description,
      t.price,
      'ACTIVE'
    FROM tickets t
    INNER JOIN events e
      ON e.id = ?
    INNER JOIN categories c
      ON c.id = e.category_id
    WHERE t.id = ?
      AND LOWER(TRIM(t.category)) = LOWER(TRIM(c.name))
      AND t.status = 'ACTIVE'
  `;

  const [result] = await db.execute<ResultSetHeader>(
    sql,
    [eventId, eventId, templateId]
  );

  return result;
};
