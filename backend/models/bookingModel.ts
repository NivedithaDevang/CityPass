import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

type Booking = {
  id?: number;
  user_id: number;
  pass_id: number;
  event_ticket_id?: number | null;
  booking_date: string | Date;
  number_of_tickets: number;
  total_amount: number;
  status?: string;
};

type BookingRow = RowDataPacket & Booking;

export type OrganiserBooking = RowDataPacket & {
  booking_id: number;
  event_id: number;
  event_name: string;
  ticket_name: string | null;
  user_name: string | null;
  user_email: string | null;
  number_of_tickets: number;
  total_amount: number;
  booking_date: string | Date;
  booking_status: string | null;
};

export const getBookingsByUserId = async (userId: number) => {

const sql = `
  SELECT
    b.id,
    b.user_id,
    u.name AS user_name,
    u.email AS user_email,
    b.pass_id,
    b.event_ticket_id,
    e.name AS event_title,
    e.slug AS slug,
    e.image AS image,
    e.location AS venue,
    e.event_date,
    e.time AS time,
    ci.name AS city_name,
    c.name AS category_name,
    et.name AS ticket_name,
    et.description AS ticket_description,
    et.price AS ticket_price,
    b.number_of_tickets,
    b.total_amount,
    b.booking_date,
    b.status
  FROM bookings b
  LEFT JOIN users u ON b.user_id = u.id
  LEFT JOIN events e ON b.pass_id = e.id
  LEFT JOIN cities ci ON e.city_id = ci.id
  LEFT JOIN categories c ON e.category_id = c.id
  LEFT JOIN event_tickets et
    ON b.event_ticket_id = et.id
    AND et.event_id = e.id
  WHERE b.user_id = ?
  ORDER BY b.id DESC
`;

  const [results] = await db.query<RowDataPacket[]>(sql, [userId]);

  return results;
};

export const getBookingsByOrganiserId = async (
  organiserId: number
): Promise<OrganiserBooking[]> => {
  const sql = `
    SELECT
      b.id AS booking_id,
      e.id AS event_id,
      e.name AS event_name,
      et.name AS ticket_name,
      u.name AS user_name,
      u.email AS user_email,
      b.number_of_tickets,
      b.total_amount,
      b.booking_date,
      b.status AS booking_status
    FROM bookings b
    INNER JOIN events e ON e.id = b.pass_id
    INNER JOIN users u ON u.id = b.user_id
    LEFT JOIN event_tickets et
      ON b.event_ticket_id = et.id
      AND et.event_id = e.id
    WHERE e.organizer_id = ?
    ORDER BY b.booking_date DESC, b.id DESC
  `;

  const [results] = await db.query<OrganiserBooking[]>(sql, [
    organiserId,
  ]);

  return results;
};

export const createBooking = async (book: Booking) => {
  const sql = `
    INSERT INTO bookings (
      user_id,
      pass_id,
      event_ticket_id,
      booking_date,
      number_of_tickets,
      total_amount,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const formattedDate = new Date(book.booking_date)
    .toISOString()
    .split("T")[0];

  const [results] = await db.query<ResultSetHeader>(sql, [
    book.user_id,
    book.pass_id,
    book.event_ticket_id ?? null,
    formattedDate,
    book.number_of_tickets,
    book.total_amount,
    book.status || "CONFIRMED",
  ]);

  return results;
};

export const updateBookingStatus = async (
  bookingId: number,
  userId: number,
  status: string
) => {
  const query = `
    UPDATE bookings
    SET status = ?
    WHERE id = ? AND user_id = ?
  `;

  const [result] = await db.query<ResultSetHeader>(query, [
    status,
    bookingId,
    userId,
  ]);

  if (result.affectedRows === 0) {
    throw new Error(
      "Booking not found or you are not authorized to modify it."
    );
  }

  return result;
};