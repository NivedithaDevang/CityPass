
import { db } from "../config/database.js";
import {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import AppError from "../types/appError.js";

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

type BookingCancellationRow = RowDataPacket & {
  id: number;
  user_id: number;
  number_of_tickets: number;
  total_amount: number | string;
  status: string;
};

// Get all bookings of a specific user.
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

  const [results] = await db.query<RowDataPacket[]>(
    sql,
    [userId]
  );

  return results;
};

// Get bookings for events owned by an organiser.
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

  const [results] = await db.query<OrganiserBooking[]>(
    sql,
    [organiserId]
  );

  return results;
};

// Create a new booking.
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

  const [results] = await db.query<ResultSetHeader>(
    sql,
    [
      book.user_id,
      book.pass_id,
      book.event_ticket_id ?? null,
      formattedDate,
      book.number_of_tickets,
      book.total_amount,
      book.status || "CONFIRMED",
    ]
  );

  return results;
};

// Update the booking status.
// Kept available for other parts of the application.
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

  const [result] = await db.query<ResultSetHeader>(
    query,
    [status, bookingId, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError(
      "Booking not found or you are not authorized to modify it.",
      404
    );
  }

  return result;
};

// Cancel a selected number of tickets or the entire booking.
export const cancelBookingTickets = async (
  bookingId: number,
  userId: number,
  cancelQuantity?: number
) => {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.execute<
      BookingCancellationRow[]
    >(
      `
        SELECT
          id,
          user_id,
          number_of_tickets,
          total_amount,
          status
        FROM bookings
        WHERE id = ? AND user_id = ?
        FOR UPDATE
      `,
      [bookingId, userId]
    );

    const booking = rows[0];

    if (!booking) {
      throw new AppError(
        "Booking not found or you are not authorized to cancel it.",
        404
      );
    }

    const currentQuantity = Number(
      booking.number_of_tickets
    );

    const currentAmount = Number(booking.total_amount);

    if (booking.status === "CANCELLED") {
      throw new AppError(
        "This booking has already been cancelled.",
        400
      );
    }

    if (
      !Number.isSafeInteger(currentQuantity) ||
      currentQuantity <= 0 ||
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      throw new AppError(
        "The booking contains invalid ticket or amount details.",
        400
      );
    }

    const quantityToCancel =
      cancelQuantity ?? currentQuantity;

    if (
      !Number.isSafeInteger(quantityToCancel) ||
      quantityToCancel <= 0
    ) {
      throw new AppError(
        "Cancellation quantity must be a positive integer.",
        400
      );
    }

    if (quantityToCancel > currentQuantity) {
      throw new AppError(
        `You can cancel at most ${currentQuantity} tickets.`,
        400
      );
    }

    const remainingQuantity =
      currentQuantity - quantityToCancel;

    const refundAmount =
      quantityToCancel === currentQuantity
        ? currentAmount
        : Math.round(
            (
              currentAmount *
              quantityToCancel /
              currentQuantity
            ) * 100
          ) / 100;

    const remainingAmount = Math.round(
      (currentAmount - refundAmount) * 100
    ) / 100;

    const newStatus =
      remainingQuantity === 0
        ? "CANCELLED"
        : booking.status;

    await connection.execute(
      `
        UPDATE bookings
        SET
          number_of_tickets = ?,
          total_amount = ?,
          status = ?
        WHERE id = ? AND user_id = ?
      `,
      [
        remainingQuantity,
        remainingAmount,
        newStatus,
        bookingId,
        userId,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return {
      bookingId,
      cancelledTickets: quantityToCancel,
      remainingTickets: remainingQuantity,
      refundAmount,
      remainingAmount,
      status: newStatus,
    };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection.release();
  }
};
