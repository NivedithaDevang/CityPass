import { db } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type OrganizerRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type OrgReq = {
    user_id?: number;
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
    user_id: number;
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

// Check if user already submitted a pending or approved request
export const getActiveRequestByUserId = async (
    userId: number
): Promise<OrgReqRow | undefined> => {
    const sql = `
        SELECT id, user_id, status 
        FROM organizer_requests 
        WHERE user_id = ? AND status IN ('PENDING', 'APPROVED')
        LIMIT 1
    `;
    const [rows] = await db.query<OrgReqRow[]>(sql, [userId]);
    return rows[0];
};

// Get all requests
export const getAllRequests = async (): Promise<OrgReqRow[]> => {
    const sql = `
        SELECT
            id,
            user_id,
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
            user_id,
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
    const [results] = await db.query<OrgReqRow[]>(sql, [id]);
    return results[0];
};

// Create organizer request with auto slug
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
            category,
            city,
            pan_card,
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
        request.category ?? null,
        request.city ?? null,
        request.pan_card ?? null,
        request.email ?? null,
        request.phone ?? null,
        request.status ?? "PENDING"
    ]);

    return result;
};

// Transaction: Approve request, create organizer profile, elevate user role
export const approveOrganizerTransaction = async (
    request: OrgReqRow
): Promise<void> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update request status to APPROVED
        await connection.execute(
            `UPDATE organizer_requests SET status = 'APPROVED' WHERE id = ?`,
            [request.id]
        );

        // Insert into organizers table
        await connection.execute(
            `INSERT INTO organizers (
                user_id,
                organization_name,
                category,
                city,
                pan_card,
                email,
                phone,
                description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                request.user_id,
                request.organization_name,
                request.category ?? null,
                request.city ?? null,
                request.pan_card ?? null,
                request.email ?? null,
                request.phone ?? null,
                request.description
            ]
        );

        // Update user role to ORGANIZER
        await connection.execute(
            `UPDATE users SET role = 'ORGANIZER' WHERE id = ?`,
            [request.user_id]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Reject request
export const rejectOrganizerRequest = async (
    id: number
): Promise<ResultSetHeader> => {
    const sql = `
        UPDATE organizer_requests
        SET status = 'REJECTED'
        WHERE id = ?
    `;
    const [result] = await db.execute<ResultSetHeader>(sql, [id]);
    return result;
};