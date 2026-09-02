import { dbConfig } from "../config/database.js";
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
    const [results] = await dbConfig.query<UserRow[]>("SELECT id, name, email, role FROM users");
    return results;
};

//get user by id
export const getUserById = async (id: number) => {
    const [results] = await dbConfig.query<UserRow[]>(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [id]
    );
    return results[0];
}

//posting a new user
export const createUser = async (user: User) => {
    const sql = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

    const [results] = await dbConfig.query<ResultSetHeader>(
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

    const [results] = await dbConfig.query<ResultSetHeader>(
        sql,
        [user.name, user.email, user.password, user.role, id]
    );
    return results;
};

