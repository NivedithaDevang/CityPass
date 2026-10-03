import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type TicketStatus = "ACTIVE" | "DELETED";

export type Ticket = {
  id?: number;
  name: string;
  description?: string | null;
  price: number;
  status?: TicketStatus;
  category: string;
};

export type TicketRow = RowDataPacket & Ticket;

export const getAllTickets = async (): Promise<TicketRow[]> => {
  const sql = `
    SELECT
      id,
      name,
      description,
      price,
      status,
      category
    FROM tickets
    WHERE status = 'ACTIVE'
    ORDER BY id DESC
  `;

  const [results] = await db.query<TicketRow[]>(sql);

  return results;
};

export const createTicket = async (
  ticket: Ticket
): Promise<ResultSetHeader> => {
  const sql = `
    INSERT INTO tickets (
      name,
      description,
      price,
      status,
      category
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute<ResultSetHeader>(sql, [
    ticket.name,
    ticket.description ?? null,
    ticket.price,
    ticket.status ?? "ACTIVE",
    ticket.category,
  ]);

  return result;
};

export const deleteTicketById = async (
  id: number
): Promise<ResultSetHeader> => {
  const sql = `
    UPDATE tickets
    SET status = 'DELETED'
    WHERE id = ?
      AND status = 'ACTIVE'
  `;

  const [result] = await db.execute<ResultSetHeader>(sql, [id]);

  return result;
};