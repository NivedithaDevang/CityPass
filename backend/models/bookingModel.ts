import db from "../config/database.js";
import { ResultSetHeader } from "mysql2";


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

type BookingCallback = (
    err: Error | null,
    result?: ResultSetHeader
) => void;


//getting all bookings
export const getAllBookings = (callback: any) => {
    db.query("SELECT * FROM bookings", callback);
};

//posting a new booking
export const createBooking = (book: Booking, callback: BookingCallback) => {
    const sql = `
        INSERT INTO bookings (user_id, pass_id, booking_date, number_of_tickets, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query<ResultSetHeader>(
        sql,
        [book.user_id, book.pass_id, book.booking_date, book.number_of_tickets, book.total_amount, book.status],
        callback
    );
};


//deleting a booking
export const removeBooking = (id: number, callback: any) => {
    db.query("DELETE FROM bookings WHERE id = ?", [id], callback);
};