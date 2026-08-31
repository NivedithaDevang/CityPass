import { db } from "../config/env.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";


//creating a type
type Booking = {
    id?: number;
    user_id: number;
    pass_id: number;
    booking_date: Date;
    number_of_tickets: number;
    total_amount: number;
    status: string
};

type BookingRow = RowDataPacket & Booking;


//getting all bookings
export const getAllBookings = async () => {
    const [results] = await db.query<BookingRow[]>("SELECT * FROM bookings");
    return results;
};

//posting a new booking
export const createBooking = async (book: Booking) => {
    const sql = `
        INSERT INTO bookings (user_id, pass_id, booking_date, number_of_tickets, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [results] = await db.query<ResultSetHeader>(
        sql,
        [book.user_id, book.pass_id, book.booking_date, book.number_of_tickets, book.total_amount, book.status]
    );
    return results;
};
