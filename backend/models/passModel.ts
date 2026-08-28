import db from "../config/database.js";
import { ResultSetHeader } from "mysql2";


//creating a type
type Pass = {
    id?: number;
    name: string;
    description: string;
    price: number;
    status: string
};

type PassCallback = (
    err: Error | null,
    result?: ResultSetHeader
) => void;


//getting all passes
export const getAllPasses = (callback: any) => {
    db.query("SELECT * FROM passes", callback);
};

//posting a new pass
export const createPass = (pass: Pass, callback: PassCallback) => {
    const sql = `
        INSERT INTO passes (name, description, price, status)
        VALUES (?, ?, ?, ?)
    `;

    db.query<ResultSetHeader>(
        sql,
        [pass.name, pass.description, pass.price, pass.status],
        callback
    );
};


//deleting a pass
export const removePass = (id: number, callback: any) => {
    db.query("DELETE FROM passes WHERE id = ?", [id], callback);
};