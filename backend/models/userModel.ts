import { db } from "../config/env.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";


//creating a type
type User = {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER" | "ADMIN";
};

type UserRow = RowDataPacket & {
    id: number;
    name: string;
    email: string;
    role: string;
};


//getting all users
export const getAllUsers = async () => {
    const [results] = await db.query<UserRow[]>("SELECT id, name, email, role FROM users");
    return results;
};

//posting a new user
export const createUser = async (user: User) => {
    const sql = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

    const [results] = await db.query<ResultSetHeader>(
        sql,
        [user.name, user.email, user.password, user.role]
    );
    return results;
};

//updating a user details
export const updateUser = async (id: number, user: User) => {
    const sql = `
        UPDATE users
        SET name = ?, email = ?, password = ?, role = ?
        WHERE id = ?
    `;

    const [results] = await db.query<ResultSetHeader>(
        sql,
        [user.name, user.email, user.password, user.role, id]
    );
    return results;
};

