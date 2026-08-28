import express from "express";
import db from "../config/database.js";
import { ResultSetHeader } from "mysql2";


//creating a type
type Event = {
    name: string;
    description: string;
    location: string;
    city: string;
    category: string;
    event_date: Date;
    price: number;
    capacity: number;
    status: string;
};

type EventCallback = (
    err: Error | null,
    result?: ResultSetHeader
) => void;


//getting all events
export const getAllEvents = (callback: any) => {
    db.query("SELECT * FROM events", callback);
};

//posting a new event
export const createEvent = (event: Event, callback: EventCallback) => {
    const sql = `
        INSERT INTO events (name, description, city, category, location, event_date, price, capacity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query<ResultSetHeader>(
        sql,
        [event.name, event.description, event.city, event.category, event.location, event.event_date, event.price, event.capacity, event.status],
        callback
    );
};

//updating a event details
export const updateEvent = (id: number, event: Event, callback: any) => {
    const sql = `
        UPDATE events
        SET name = ?, description = ?, city = ?, category = ?, location = ?, event_date = ?, price = ?, capacity = ?, status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [event.name, event.description, event.city, event.category, event.location, event.event_date, event.price, event.capacity, event.status, id],
        callback
    );
};

//deleting a event
export const removeEvent = (id: number, callback: any) => {
    db.query("DELETE FROM events WHERE id = ?", [id], callback);
};