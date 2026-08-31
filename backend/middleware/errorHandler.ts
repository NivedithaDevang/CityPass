import { Request, Response, NextFunction } from "express";

const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    res.status(500).json({
        message: "Something went wrong",
        error: err.message
    });
};

export default errorHandler;