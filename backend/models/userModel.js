import db from "../config/database.js";

export const getAllUsers = (callback) => {
    db.query("SELECT * FROM users", callback);
};

export const createUser = (user, callback) => {
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(
        sql,
        [user.name, user.email, user.password, user.role],
        callback
    );
};