import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { AuthPayLoad } from "../types/auth.js";

export type User = RowDataPacket &
  AuthPayLoad & {
    name: string;
    email: string;
    password?: string;
    status?: string;
    role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
    token_version: number;
  };

export type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
  phone: string | null;
  city_id: number | null;
  dob: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  profile_image: string | null;
  status: "ACTIVE" | "INACTIVE";
  token_version: number;
};

export type UserAuthRow = RowDataPacket & {
  id: number;
  email: string;
  password: string;
  role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "INACTIVE";
  token_version: number;
};

export const getUserById = async (id: number): Promise<UserRow | undefined> => {
  const [results] = await db.query<UserRow[]>(
    `
      SELECT
        id,
        name,
        email,
        role,
        phone,
        city_id,
        dob,
        gender,
        profile_image,
        status,
        token_version
      FROM users
      WHERE id = ?
    `,
    [id]
  );

  return results[0];
};

export const getUserAuthByEmail = async (
  email: string
): Promise<UserAuthRow | undefined> => {
  const [results] = await db.query<UserAuthRow[]>(
    `SELECT id, email, password, role, status, token_version FROM users WHERE email = ?`,
    [email]
  );

  return results[0];
};

export const reactivateUser = async (
  id: number
): Promise<{ token_version: number }> => {
  await db.query(
    `UPDATE users 
     SET status = 'ACTIVE', deactivated_at = NULL, token_version = token_version + 1 
     WHERE id = ?`,
    [id]
  );

  const [rows] = await db.query<(RowDataPacket & { token_version: number })[]>(
    `SELECT token_version FROM users WHERE id = ?`,
    [id]
  );

  return { token_version: rows[0].token_version };
};

export const createUser = async (user: User) => {
  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `;

  const [results] = await db.query<ResultSetHeader>(sql, [
    user.name,
    user.email,
    user.password,
    user.role,
  ]);

  return results;
};

export const updatePassword = async (
  id: number,
  hashedPassword: string
) => {
  const sql = `
    UPDATE users
    SET password = ?
    WHERE id = ?
  `;

  const [results] = await db.query<ResultSetHeader>(sql, [
    hashedPassword,
    id,
  ]);

  return results;
};

export const updateUserProfile = async (
  id: number,
  profile: {
    name: string;
    phone: string | null;
    city_id: number | null;
    dob: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    profile_image: string | null;
  }
) => {
  const sql = `
    UPDATE users
    SET
      name = ?,
      phone = ?,
      city_id = ?,
      dob = ?,
      gender = ?,
      profile_image = COALESCE(?, profile_image)
    WHERE id = ?
  `;

  const [results] = await db.query<ResultSetHeader>(sql, [
    profile.name,
    profile.phone,
    profile.city_id,
    profile.dob,
    profile.gender,
    profile.profile_image,
    id,
  ]);

  return results;
};


export const getAllUsers = async () => {
  const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.status,
      u.city_id,
      c.name AS city_name
    FROM users u
    LEFT JOIN cities c
      ON u.city_id = c.id
    ORDER BY u.id DESC
  `;

  const [results] = await db.query(sql);

  return results;
};



