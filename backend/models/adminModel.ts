import { db } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import { saltRounds } from "../config/env.js";

export const createCityAdmin = async (
  name: string,
  email: string,
  password: string,
  cityId: number
): Promise<number> => {
  const [countResult] = await db.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'admin'
      AND city_id = ?
    `,
    [cityId]
  );

  const adminCount = Number(countResult[0]?.count ?? 0);

  if (adminCount >= 2) {
    const error: any = new Error(
      "Limit reached: This city already has 2 assigned admins."
    );

    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(
    password,
    saltRounds
  );

  const [result] = await db.query<ResultSetHeader>(
    `
      INSERT INTO users
      (
        name,
        email,
        password,
        role,
        city_id,
        token_version
      )
      VALUES (?, ?, ?, 'admin', ?, 1)
    `,
    [
      name,
      email,
      hashedPassword,
      cityId,
    ]
  );

  return result.insertId;
};

export const revokeCityAdmin = async (
  adminId: number
): Promise<boolean> => {
  const [result] = await db.query<ResultSetHeader>(
    `
      UPDATE users
      SET
        role = 'user',
        city_id = NULL
      WHERE id = ?
      AND role = 'admin'
    `,
    [adminId]
  );

  return result.affectedRows > 0;
};