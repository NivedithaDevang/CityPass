import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { AuthPayLoad } from "../types/auth.js";

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string | null;
  city_id?: number | null;
  dob?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  profile_image?: string | null;
}


export type User = RowDataPacket &
  AuthPayLoad & {
    name: string;
    email: string;
    password?: string;
    status?: string;
    role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
    token_version: number;
    created_at?: Date | string | null;
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
  created_at?: string | null;
};

export type UserAuthRow = RowDataPacket & {
  id: number;
  email: string;
  password: string;
  role: "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "INACTIVE";
  token_version: number;
  created_at?: string | null;
};
export type Query = RowDataPacket & {
  id: number;
  name: string;
  query: string;
}

export const addQuery = async (id: number,query: Query): Promise<ResultSetHeader> => {
  const sql = `
  UPDATE users SET query = ? WHERE id = ?`;

  const [results] = await db.query<ResultSetHeader>(sql, [
    query.query,
    id
  ]);
  return results;
}


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
        DATE_FORMAT(dob, '%Y-%m-%d') AS dob,
        gender,
        profile_image,
        created_at,
        status
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
     SET status = 'ACTIVE', token_version = token_version + 1
     WHERE id = ?`,
    [id]
  );

  const [rows] = await db.query<(RowDataPacket & { token_version: number })[]>(
    `SELECT token_version FROM users WHERE id = ?`,
    [id]
  );

  return { token_version: rows[0].token_version };
};


export const deactivateUser = async (
  email: string,
  reason: string
): Promise<ResultSetHeader> => {
  const sql = `
    UPDATE users 
    SET 
      status = 'INACTIVE', 
      deactivated_at = NOW(), 
      deactivation_reason = ?, 
      token_version = token_version + 1 
    WHERE email = ? AND status = 'ACTIVE'
  `;

  const [result] = await db.query<ResultSetHeader>(sql, [reason, email]);
  return result;
};

export const createUser = async (user: User) => {
  const sql = `
    INSERT INTO users (name, email, password, role, created_at)
    VALUES (?, ?, ?, ?, NOW())
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
  profile: UpdateProfileInput
) => {
  const fields: string[] = [];
  const values: any[] = [];

  // Dynamically push only defined properties
  for (const [key, value] of Object.entries(profile)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  // If no fields were provided, return a neutral match object
  if (fields.length === 0) {
    return { affectedRows: 0, matchedRows: 1 };
  }

  values.push(id);
  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

  const [results] = await db.query<ResultSetHeader>(sql, values);
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
      u.created_at,
      c.name AS city_name
    FROM users u
    LEFT JOIN cities c
      ON u.city_id = c.id
    ORDER BY u.id DESC
  `;

  const [results] = await db.query(sql);

  return results;
};

