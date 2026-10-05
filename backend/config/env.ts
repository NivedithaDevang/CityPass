import dotenv from "dotenv";
dotenv.config();

export const database = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
};

export const SERVER_PORT = process.env.PORT || 5000;

export const saltRounds = 10;

export const REACTURL = process.env.REACT_URL;

export const JWT_SECRET = process.env.JWT_SECRET;

export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN?.toLowerCase().trim();