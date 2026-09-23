import { db } from "../config/database.js";

// Getting all organizers
export const getAllOrganizers = async () => {
    const [results] = await db.query(
        "SELECT * FROM organizers"
    );

    return results;
};