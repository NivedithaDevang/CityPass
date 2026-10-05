import { db } from "../config/database.js";
import { RowDataPacket } from "mysql2";

export const approveOrganiserRequest = async (
  requestId: number
): Promise<void> => {

  const connection = await db.getConnection();

  try {

    await connection.beginTransaction();

    const [requestRows] =
      await connection.query<RowDataPacket[]>(
        `
        SELECT
          id,
          user_id,
          organization_name,
          description,
          email,
          status
        FROM organizer_requests
        WHERE id = ?
        FOR UPDATE
        `,
        [requestId]
      );

    if (requestRows.length === 0) {
      throw new Error("Organiser request not found");
    }

    const request = requestRows[0];

    if (request.status !== "PENDING") {
      throw new Error(
        "Only pending organiser requests can be approved"
      );
    }

    if (!request.user_id) {
      throw new Error(
        "This organiser request is not linked to a user"
      );
    }

    await connection.query(
      `
      UPDATE users
      SET role = 'ORGANIZER'
      WHERE id = ?
      `,
      [request.user_id]
    );

    await connection.query(
      `
      INSERT INTO organizers
      (
        user_id,
        description,
        email,
        stage_name
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        request.user_id,
        request.description ?? null,
        request.email ?? null,
        request.organization_name ?? null,
      ]
    );

    await connection.query(
      `
      UPDATE organizer_requests
      SET status = 'APPROVED'
      WHERE id = ?
      `,
      [requestId]
    );

    await connection.commit();

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {

    connection.release();

  }
};