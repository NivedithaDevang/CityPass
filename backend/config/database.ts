import mysql from "mysql2/promise";
import { db } from "./env.js";

export const dbConfig = mysql.createPool(db);

dbConfig.getConnection()
  .then(() => {
    console.log("Database connection established");
  })
  .catch(() => {
    console.error("Failed to establish database connection");
  });

export default dbConfig;