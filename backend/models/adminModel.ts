import { db } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserRole } from "../types/auth.js";
import bcrypt from "bcrypt";
import { saltRounds } from "../config/env.js";

// User List
export type UserListRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  city_id: number | null;
};

// 1. Get all users (scoped by city if cityId is provided)
export const getAllUsers = async (cityId?: number | null): Promise<UserListRow[]> => {
  let sql = `
    SELECT id, name, email, role, city_id
    FROM users
  `;
  const params: any[] = [];

  if (cityId) {
    sql += " WHERE city_id = ?";
    params.push(cityId);
  }

  sql += " ORDER BY id DESC";
  const [results] = await db.query<UserListRow[]>(sql, params);
  return results;
};

// 2. Organizer Requests (scoped by city if applicable)
export const getAllOrganiserRequests = async (cityId?: number | null) => {
  let sql = `
    SELECT
      r.id,
      r.user_id,
      r.organization_name,
      r.description,
      r.status,
      u.city_id,
      c.name AS city_name
    FROM organizer_requests r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN cities c ON u.city_id = c.id
  `;
  const params: any[] = [];

  if (cityId) {
    sql += " WHERE u.city_id = ?";
    params.push(cityId);
  }

  sql += " ORDER BY r.id DESC";
  const [results] = await db.query(sql, params);
  return results;
};

// 3. Organizers (scoped by city if applicable)
export const getAllOrganisers = async (cityId?: number | null) => {
  let sql = `
    SELECT
      o.id,
      o.user_id,
      o.organization_name,
      o.description,
      u.city_id,
      c.name AS city_name
    FROM organizers o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN cities c ON u.city_id = c.id
  `;
  const params: any[] = [];

  if (cityId) {
    sql += " WHERE u.city_id = ?";
    params.push(cityId);
  }

  sql += " ORDER BY o.id DESC";
  const [results] = await db.query(sql, params);
  return results;
};

// 4. Cities (Global view)
export const getAllCities = async () => {
  const sql = `
    SELECT id, name, description, is_active
    FROM cities
    ORDER BY id DESC
  `;
  const [results] = await db.query(sql);
  return results;
};

// 5. Categories (Global view)
export const getAllCategories = async () => {
  const sql = `
    SELECT id, name, is_active
    FROM categories
    ORDER BY id DESC
  `;
  const [results] = await db.query(sql);
  return results;
};

// 6. Events (scoped by city if cityId is provided)
export const getAllEvents = async (cityId?: number | null) => {
  let sql = `
    SELECT
      id,
      organizer_id,
      city_id,
      category_id,
      name,
      description,
      location,
      event_date,
      time,
      price,
      capacity,
      status,
      slug
    FROM events
  `;
  const params: any[] = [];

  if (cityId) {
    sql += " WHERE city_id = ?";
    params.push(cityId);
  }

  sql += " ORDER BY id DESC";
  const [results] = await db.query(sql, params);
  return results;
};

// 7. Add admin limit to 2 per city
export const createCityAdmin = async (
  name: string,
  email: string,
  password: string,
  cityId: number
): Promise<number> => {
  const [countResult] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND city_id = ?",
    [cityId]
  );

  const adminCount = countResult[0]?.count ?? 0;
  if (adminCount >= 2) {
    const error: any = new Error("Limit reached: This city already has 2 assigned admins.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO users (name, email, password, role, city_id, token_version) VALUES (?, ?, ?, 'admin', ?, 1)",
    [name, email, hashedPassword, cityId]
  );

  return result.insertId;
};

// 8. Revoke admin status
export const revokeCityAdmin = async (adminId: number): Promise<boolean> => {
  const [result] = await db.query<ResultSetHeader>(
    "UPDATE users SET role = 'user', city_id = NULL WHERE id = ? AND role = 'admin'",
    [adminId]
  );
  return result.affectedRows > 0;
};