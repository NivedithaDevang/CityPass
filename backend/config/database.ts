import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }

    console.log("MySQL connected successfully");

    connection.release();
});

export default db;