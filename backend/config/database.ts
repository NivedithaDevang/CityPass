import mysql from "mysql2/promise";
import { database } from "./env.js";

export const db = mysql.createPool(database);

db.getConnection()
  .then((connection) => {
    console.log("Database connection established");
    //added connection.release()
    connection.release();
  })
  .catch((error) => {
    console.error("Failed to establish database connection:", error);
  });

export default db;