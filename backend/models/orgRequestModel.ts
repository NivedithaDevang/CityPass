import db from "../config/database.js";


//creating a type
type OrgReq = {
    user_id: number;
    organization_name: string;
    description: string;
    status: string;
};
//getting all organiser requests
export const getAllRequests = (callback: any) => {
    db.query("SELECT * FROM organizer_requests", callback);
};

//posting a new organizer request
export const createRequest = (request: OrgReq, callback: any) => {
    const sql = `
        INSERT INTO organizer_requests (user_id, organization_name, description, status)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [request.user_id, request.organization_name, request.description, request.status],
        callback
    );
};

//updating a user details
export const updateRequest = (id: number, org: OrgReq, callback: any) => {
    const sql = `
        UPDATE organizer_requests
        SET organization_name = ?, description = ?, status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [org.status, id],
        callback
    );
};

//deleting a user
export const removeRequest = (id: number, callback: any) => {
    db.query("DELETE FROM organizer_requests WHERE id = ?", [id], callback);
};