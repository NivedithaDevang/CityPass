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
    const { booking_date, number_of_tickets, total_amount, status } = req.body;
     if (!booking_date || !number_of_tickets || !total_amount || !status) {
        return res.status(400).json({
            message: "Booking date, Number of tickets, total amount are required"
        });
    }


    createBooking(
        { booking_date, number_of_tickets, total_amount, status },
            (err: any, result) => {
            if (err) {
            
                return res.status(500).json({
                    message: "Unable to create booking"
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