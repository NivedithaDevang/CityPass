
import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type OrganizerRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

export type OrgReq = {
    user_id?: number;
    organization_name: string;
    description: string;

    // Foreign key IDs
    category_id?: number;
    city_id?: number;

    id_proof?: string;
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

    // IDs
    category_id?: number;
    city_id?: number;

    // Names returned through JOIN
    category?: string;
    city?: string;

    id_proof?: string;
    email?: string;
    phone?: string;
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
            o.category_id,
            o.city_id,
            c.name AS category,
            ci.name AS city,
            o.id_proof,
            o.email,
            o.phone
        FROM organizer_requests o
        LEFT JOIN categories c
            ON o.category_id = c.id
        LEFT JOIN cities ci
            ON o.city_id = ci.id
        WHERE o.user_id = ?
          AND o.status IN ('PENDING', 'APPROVED')
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
            o.category_id,
            o.city_id,
            c.name AS category,
            ci.name AS city,
            o.id_proof,
            o.email,
            o.phone
        FROM organizer_requests o
        LEFT JOIN categories c
            ON o.category_id = c.id
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
            o.category_id,
            o.city_id,
            c.name AS category,
            ci.name AS city,
            o.id_proof,
            o.email,
            o.phone
        FROM organizer_requests o
        LEFT JOIN categories c
            ON o.category_id = c.id
        LEFT JOIN cities ci
            ON o.city_id = ci.id
        WHERE o.id = ?
    `;

    const [results] = await db.query<OrgReqRow[]>(sql, [id]);

    return results[0];
};

export const createRequest = async (
    request: OrgReq
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
            category_id,
            city_id,
            id_proof,
            email,
            phone,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute<ResultSetHeader>(sql, [
        request.user_id ?? null,
        request.organization_name,
        request.description,
        slug,
        request.category_id ?? null,
        request.city_id ?? null,
        request.id_proof ?? null,
        request.email ?? null,
        request.phone ?? null,
        request.status ?? "PENDING",
    ]);

    return result;
};
