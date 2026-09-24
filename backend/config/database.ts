import mysql from "mysql2/promise";
import { database } from "./env.js";

export const db = mysql.createPool(database);

export async function connectDB() {
  try {
    const connection = await db.getConnection();
    console.log("Database connection established");
    connection.release();
  } catch (error) {
    console.error("Failed to establish database connection:", error);
  }
}