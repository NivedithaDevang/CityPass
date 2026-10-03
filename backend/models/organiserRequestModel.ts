import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type OrganizerRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED";


export type OrgReq = {
    organization_name: string;
    description: string;
    category?: string;
    city?: string;
    pan_card?: string;
    email?: string;
    phone?: string;
    status?: OrganizerRequestStatus;
};


export type OrgReqRow = RowDataPacket & {
    id: number;
    organization_name: string;
    description: string;
    status: OrganizerRequestStatus;
    slug?: string;
    category?: string;
    city?: string;
    pan_card?: string;
    email?: string;
    phone?: string;
};


// Get all organizer requests
export const getAllRequests = async (): Promise<OrgReqRow[]> => {

    const sql = `
        SELECT
            id,
            organization_name,
            description,
            status,
            slug,
            category,
            city,
            pan_card,
            email,
            phone
        FROM organizer_requests
        ORDER BY id DESC
    `;

    const [results] = await db.query<OrgReqRow[]>(sql);

    return results;
};


// Get organizer request by ID
export const getOrganizerRequestById = async (
    id: number
): Promise<OrgReqRow | undefined> => {

    const sql = `
        SELECT
            id,
            organization_name,
            description,
            status,
            slug,
            category,
            city,
            pan_card,
            email,
            phone
        FROM organizer_requests
        WHERE id = ?
    `;

    const [results] = await db.query<OrgReqRow[]>(
        sql,
        [id]
    );

    return results[0];
};


// Create organizer request
export const createRequest = async (
    request: OrgReq
): Promise<ResultSetHeader> => {

    const sql = `
        INSERT INTO organizer_requests (
            organization_name,
            description,
            category,
            city,
            pan_card,
            email,
            phone,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute<ResultSetHeader>(
        sql,
        [
            request.organization_name,
            request.description,
            request.category ?? null,
            request.city ?? null,
            request.pan_card ?? null,
            request.email ?? null,
            request.phone ?? null,
            request.status ?? "PENDING"
        ]
    );

    return result;
};


// Update organizer request status
export const updateRequestStatus = async (
    id: number,
    status: "APPROVED" | "REJECTED"
): Promise<ResultSetHeader> => {

    const sql = `
        UPDATE organizer_requests
        SET status = ?
        WHERE id = ?
    `;

    const [result] = await db.execute<ResultSetHeader>(
        sql,
        [status, id]
    );

    return result;
};