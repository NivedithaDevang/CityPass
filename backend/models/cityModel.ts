import db from "../config/database.js";


//creating a type
type Cities = {
    name: string;
    description: string
};
//getting all cities
export const getAllCities = (callback: any) => {
    db.query("SELECT * from cities", callback);
};