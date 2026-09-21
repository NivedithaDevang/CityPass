import { db } from "../config/database.js";

//getting all organizers

export const getAllOrganizers = (callback: any) => {
    db.query("SELECT * from organizers", callback);
};