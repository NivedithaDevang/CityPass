import db from "../config/database.js";
import { ResultSetHeader } from "mysql2";


//creating a type
type User = {
    name: string;
    email: string;
    password: string;
    role: string;
};

type UserCallback = (
    err: Error | null,
    result?: ResultSetHeader
) => void;


//getting all users
export const getAllUsers = (callback: any) => {
    db.query("SELECT id, name, email, role FROM users", callback);
};

//posting a new user
export const createUser = (user: User, callback: UserCallback) => {
    const sql = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

    db.query<ResultSetHeader>(
        sql,
        [user.name, user.email, user.password, user.role],
        callback
    );
};

//updating a user details
export const updateUser = (id: number, user: User, callback: any) => {
    const sql = `
        UPDATE users
        SET name = ?, email = ?, password = ?, role = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [user.name, user.email, user.password, user.role, id],
        callback
    );
};

//deleting a user
export const removeUser = (id: number, callback: any) => {
    db.query("DELETE FROM users WHERE id = ?", [id], callback);
};