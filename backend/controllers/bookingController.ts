import {
    getAllBookings,
    createBooking,
    removeBooking
} from "../models/bookingModel.js"
import { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";


//for getting all bookings

export const getBookings = (req: Request, res: Response) => {
    
    getAllBookings((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch bookings",
                error: err
            });
        }

        res.status(200).json({
            message: "Bookings fetched successfully",
            users: results
        });
    });
};

//for posting new booking
export const addBooking = async (req: Request, res: Response) => {
    const { user_id, pass_id, booking_date, number_of_tickets, total_amount, status = "CONFIRMED" } = req.body;
     if (user_id === undefined || pass_id === undefined || !booking_date || number_of_tickets === undefined || total_amount === undefined) {
        return res.status(400).json({
            message: "user_id, pass_id, booking_date, number_of_tickets and total_amount are required"
        });
    }


    createBooking(
        { user_id, pass_id, booking_date, number_of_tickets, total_amount, status },
            (err: any, result) => {
            if (err) {
            
                return res.status(500).json({
                    message: "Unable to create booking",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Booking created successfully",
                userId: result?.insertId
            });
        }
    );
};




//deleting a booking

export const deleteBooking = (req: Request, res: Response) => {
    const bookId = Number(req.params.id);

    removeBooking(bookId, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to delete booking"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.status(200).json({
            message: "Booking deleted successfully"
        });
    });
};