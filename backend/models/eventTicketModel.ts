
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

export const updateEventTicket = async (
  eventId: number,
  ticketId: number,
  name: string,
  description: string | null,
  price: number
): Promise<ResultSetHeader> => {
  const sql = `
    UPDATE event_tickets
    SET name = ?, description = ?, price = ?
    WHERE id = ? AND event_id = ? AND status = 'ACTIVE'
  `;

  const [result] = await db.execute<ResultSetHeader>(sql, [
    name,
    description,
    price,
    ticketId,
    eventId,
  ]);

  return result;
};

export const deleteEventTicket = async (
  eventId: number,
  ticketId: number
): Promise<ResultSetHeader> => {
  const sql = `
    UPDATE event_tickets
    SET status = 'DELETED'
    WHERE id = ? AND event_id = ? AND status = 'ACTIVE'
  `;

  const [result] = await db.execute<ResultSetHeader>(sql, [
    ticketId,
    eventId,
  ]);

  return result;
};
