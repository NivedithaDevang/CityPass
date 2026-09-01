import { db } from "../config/env.js";
import { RowDataPacket } from "mysql2/promise";

export type AuthUser = RowDataPacket & {
    id: number;
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER" | "ADMIN";
};


/*This is the answer for the question : 
Does a user with this email exist, and if so, give me their details.
*/
export const findUserByEmail = async (email: string): Promise<AuthUser | undefined> => {
    const sql = `
        SELECT id, name, email, password, role
        FROM users
        WHERE email = ?
    `;


    //Grabs the very first row found in the database.
    const [results] = await db.query<AuthUser[]>(sql, [email]);
    return results[0];
};

export const createUser = async (user: {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER" | "ADMIN";
}): Promise<{ insertId: number }> => {
    const sql = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query<any>(sql, [
        user.name,
        user.email,
        user.password,
        user.role
    ]);

    return { insertId: (result as any).insertId };
}