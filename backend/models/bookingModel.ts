import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

type Booking = {
  id?: number;
  user_id: number;
  pass_id: number;
  booking_date: string | Date;
  number_of_tickets: number;
  total_amount: number;
  status?: string;
};

type BookingRow = RowDataPacket & Booking;

export const getAllBookings = async () => {
  const sql = `
    SELECT 
      b.id,
      b.user_id,
      u.name AS user_name,
      u.email AS user_email,
      b.pass_id,
      e.name AS event_title,
      e.location AS venue,
      e.event_date,
      c.name AS category_name,
      b.number_of_tickets,
      b.total_amount,
      b.booking_date,
      b.status
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN events e ON b.pass_id = e.id
    LEFT JOIN categories c ON e.category_id = c.id
    ORDER BY b.id DESC
  `;

  const [results] = await db.query<RowDataPacket[]>(sql);
  return results;
};

export const createBooking = async (book: Booking) => {
  const sql = `
    INSERT INTO bookings (user_id, pass_id, booking_date, number_of_tickets, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Format to YYYY-MM-DD
  const formattedDate = new Date(book.booking_date).toISOString().split("T")[0];

  const [results] = await db.query<ResultSetHeader>(sql, [
    book.user_id,
    book.pass_id,
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

  const [result]: any = await db.query(query, [status, bookingId, userId]);

  if (result.affectedRows === 0) {
    throw new Error("Booking not found or you are not authorized to modify it.");
  }

  return result;
};