import dotenv from "dotenv";
dotenv.config();

export const db = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
};


export const saltRounds = 10;

export const REACTURL= "http://localhost:5174";