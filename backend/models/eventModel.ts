import express from "express";
import db from "../config/database.js";
import { QueryValues, ResultSetHeader } from "mysql2";


//creating a type
type Event = {
    organizer_id: {} | QueryValues;
    city_id: number;
    category_id: number;
    name: string;
    description?: string;
    location?: string;
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
        INSERT INTO events (organizer_id, city_id, category_id, name, description, location, event_date, price, capacity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query<ResultSetHeader>(
        sql,
        [ event.organizer_id, event.city_id, event.category_id, event.name, event.description, event.location, event.event_date, event.price, event.capacity, event.status],
        callback
    );
};

//updating a event details
export const updateEvent = (id: number, event: Event, callback: any) => {
    const sql = `
        UPDATE events
        SET name = ?, description = ?, city_id = ?, category_id = ?, location = ?, event_date = ?, price = ?, capacity = ?, status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [event.name, event.description, event.city_id, event.category_id, event.location, event.event_date, event.price, event.capacity, event.status, id],
        callback
    );
};

//deleting a event
export const removeEvent = (id: number, callback: any) => {
    db.query("DELETE FROM events WHERE id = ?", [id], callback);
};