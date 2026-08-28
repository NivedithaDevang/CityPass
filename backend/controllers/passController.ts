import {
    getAllPasses,
    createPass,
    removePass
} from "../models/passModel.js"
import { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";


//for getting all passes

export const getPasses = (req: Request, res: Response) => {
    
    getAllPasses((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch passes",
                error: err
            });
        }

        res.status(200).json({
            message: "Passes fetched successfully",
            users: results
        });
    });
};

//for posting new pass
export const addPass = async (req: Request, res: Response) => {
    const { name, description, price, status } = req.body;
     if (!name || !description || !price || !status) {
        return res.status(400).json({
            message: "Pass name, description, price, status are required"
        });
    }


    createPass(
        { name, description, price, status },
            (err: any, result) => {
            if (err) {
            
                return res.status(500).json({
                    message: "Unable to create pass"
                });
            }

            res.status(201).json({
                message: "Pass created successfully",
                userId: result?.insertId
            });
        }
    );
};




//deleting a pass

export const deletePass = (req: Request, res: Response) => {
    const passId = Number(req.params.id);

    removePass(passId, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to delete pass"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Pass not found"
            });
        }

        res.status(200).json({
            message: "Pass deleted successfully"
        });
    });
};