import db from "../config/database.js";


//creating a type
type Categories = {
    name: string
};
//getting all cities
export const getAllCategories = (callback: any) => {
    db.query("SELECT * from categories", callback);
};