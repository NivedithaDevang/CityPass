
import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type OrganizerRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

export type OrganiserReq = {
    user_id?: number;
    organization_name: string;
    description: string;

    city_id?: number;

    id_proof?: string;
    id_proof_file?: string | null;
    email?: string;
    phone?: string;
    status?: OrganizerRequestStatus;
};

export type OrgReqRow = RowDataPacket & {
    id: number;
    user_id: number;
    organization_name: string;
    description: string;
    status: OrganizerRequestStatus;
    slug?: string;

    city_id?: number;

    city?: string;

    id_proof?: string;
    id_proof_file?: string | null;
    email?: string;
    phone?: string;
    rejection_reason?: string | null;
};

export const getActiveRequestByUserId = async (
    userId: number
): Promise<OrgReqRow | undefined> => {
    const sql = `
        SELECT
            o.id,
            o.user_id,
            o.organization_name,
            o.description,
            o.status,
            o.slug,
            o.city_id,
            ci.name AS city,
            o.id_proof,
            o.idproof_image AS id_proof_file,
            o.email,
            o.phone
        FROM organizer_requests o
        LEFT JOIN cities ci
            ON o.city_id = ci.id
        WHERE o.user_id = ?
          AND o.status IN ('PENDING', 'APPROVED')
        LIMIT 1
    `;

    const [rows] = await db.query<OrgReqRow[]>(sql, [userId]);

    return rows[0];
};

export const getLatestRequestByUserId = async (
    userId: number
): Promise<OrgReqRow | undefined> => {
    const sql = `
        SELECT
            o.id,
            o.user_id,
            o.organization_name,
            o.description,
            o.status,
            o.rejection_reason
        FROM organizer_requests o
        WHERE o.user_id = ?
        ORDER BY o.id DESC
        LIMIT 1
    `;

    const [rows] = await db.query<OrgReqRow[]>(sql, [userId]);
    return rows[0];
};

export const getAllRequests = async (): Promise<OrgReqRow[]> => {
    const sql = `
        SELECT
            o.id,
            o.user_id,
            o.organization_name,
            o.description,
            o.status,
            o.slug,
            o.city_id,
            ci.name AS city,
            o.id_proof,
            o.idproof_image AS id_proof_file,
            o.email,
            o.phone,
            o.rejection_reason
        FROM organizer_requests o
        LEFT JOIN cities ci
            ON o.city_id = ci.id
        ORDER BY o.id DESC
    `;

    const [results] = await db.query<OrgReqRow[]>(sql);

    return results;
};

export const getOrganizerRequestById = async (
    id: number
): Promise<OrgReqRow | undefined> => {
    const sql = `
        SELECT
            o.id,
            o.user_id,
            o.organization_name,
            o.description,
            o.status,
            o.slug,
            o.city_id,
            ci.name AS city,
            o.id_proof,
            o.idproof_image AS id_proof_file,
            o.email,
            o.phone,
            o.rejection_reason
        FROM organizer_requests o
        LEFT JOIN cities ci
            ON o.city_id = ci.id
        WHERE o.id = ?
    `;

    const [results] = await db.query<OrgReqRow[]>(sql, [id]);

    return results[0];
};

export const resubmitRejectedRequest = async (
    requestId: number,
    userId: number,
    request: OrganiserReq
): Promise<ResultSetHeader> => {
    const slug =
        request.organization_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now();

    const sql = `
        UPDATE organizer_requests
        SET
            organization_name = ?,
            description = ?,
            slug = ?,
            city_id = ?,
            id_proof = ?,
            idproof_image = ?,
            email = ?,
            phone = ?,
            status = 'PENDING',
            rejection_reason = NULL
        WHERE id = ?
          AND user_id = ?
          AND status = 'REJECTED'
    `;

    const [result] = await db.execute<ResultSetHeader>(sql, [
        request.organization_name,
        request.description,
        slug,
        request.city_id ?? null,
        request.id_proof ?? null,
        request.id_proof_file ?? null,
        request.email ?? null,
        request.phone ?? null,
        requestId,
        userId,
    ]);

    return result;
};

export const createRequest = async (
    request: OrganiserReq
): Promise<ResultSetHeader> => {
    const slug =
        request.organization_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now();

    const sql = `
        INSERT INTO organizer_requests (
            user_id,
            organization_name,
            description,
            slug,
            city_id,
            id_proof,
            email,
            phone,
            status,
            idproof_image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute<ResultSetHeader>(sql, [
        request.user_id ?? null,
        request.organization_name,
        request.description,
        slug,
        request.city_id ?? null,
        request.id_proof ?? null,
        request.email ?? null,
        request.phone ?? null,
        request.status ?? "PENDING",
        request.id_proof_file ?? null
    ]);

    return result;
};
