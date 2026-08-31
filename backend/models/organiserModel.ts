import db from "../config/database.js";


//creating a type
type Organizers = {
    user_id: number;
    name: string;
    description: string
};
//getting all organizers

export const getAllOrganizers = (callback: any) => {
    db.query("SELECT * from organizers", callback);
};