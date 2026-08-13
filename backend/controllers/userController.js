import { getAllUsers, createUser } from "../models/userModel.js";

export const getUsers = (req, res) => {
    getAllUsers((err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching users"
            });
        }

        res.json(results);
    });
};

export const addUser = (req, res) => {
    createUser(req.body, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: err.message
            });
        }

        res.status(201).json({
            message: "User created successfully",
            userId: result.insertId
        });
    });
};