import { Request, Response, NextFunction } from "express";

import {
  getAllTickets,
  createTicket,
  deleteTicketById,
} from "../models/ticketModel.js";

export const getTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tickets = await getAllTickets();

    return res.status(200).json({
      message: "Tickets fetched successfully",
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const addTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      price,
      category,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Ticket name is required",
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        message: "Ticket price is required",
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        message: "Ticket category is required",
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    const result = await createTicket({
      name: name.trim(),
      description: description?.trim() || null,
      price: numericPrice,
      status: "ACTIVE",
      category: category.trim(),
    });

    return res.status(201).json({
      message: "Ticket created successfully",
      ticketId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        message: "A valid ticket ID is required",
      });
    }

    const result = await deleteTicketById(ticketId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Ticket not found or already deleted",
      });
    }

    return res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};