import { dbConfig } from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";


//creating a type
type OrgReq = {
    user_id: number;
    organization_name: string;
    description: string;
    status: string;
};

type OrgReqRow = RowDataPacket & OrgReq & { id: number };

//getting all organiser requests
export const getAllRequests = async () => {
    const [results] = await dbConfig.query<OrgReqRow[]>("SELECT * FROM organizer_requests");
    return results;
};

//posting a new organizer request
export const createRequest = async (request: OrgReq) => {
    const sql = `
        INSERT INTO organizer_requests (user_id, organization_name, description, status)
        VALUES (?, ?, ?, ?)
    `;

    const [results] = await dbConfig.query<ResultSetHeader>(
        sql,
        [request.user_id, request.organization_name, request.description, request.status]
    );
    return results;
};

//updating a request details
export const updateRequest = async (id: number, org: OrgReq) => {
    const sql = `
        UPDATE organizer_requests
        SET organization_name = ?, description = ?, status = ?
        WHERE id = ?
    `;

    const [results] = await dbConfig.query<ResultSetHeader>(
        sql,
        [org.organization_name, org.description, org.status, id]
    );
    return results;
};

