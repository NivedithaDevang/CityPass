import { dbConfig } from "../config/database.js";


//creating a type
type Organizers = {
    user_id: number;
    name: string;
    description: string
};
//getting all organizers

export const getAllOrganizers = (callback: any) => {
    dbConfig.query("SELECT * from organizers", callback);
};