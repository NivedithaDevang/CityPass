import db from "../config/database.js";
import { RowDataPacket } from "mysql2";

export type AuthUser = RowDataPacket & {
    id: number;
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER" | "ADMIN";
};

export const findUserByEmail = (
    email: string,
    callback: (err: Error | null, user?: AuthUser) => void
) => {
    const sql = `
        SELECT id, name, email, password, role
        FROM users
        WHERE email = ?
    `;

    db.query<AuthUser[]>(sql, [email], (err, results) => {
        if (err) {
            return callback(err);
        }

        callback(null, results[0]);
    });
};