
import { Request, Response, NextFunction } from "express";

interface AppErrorType extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

const errorHandler = (
    err: AppErrorType,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // If the response has already been sent,
    // let Express handle the remaining error.
    if (res.headersSent) {
        next(err);
        return;
    }

    // Default to 500 for unexpected errors.
    const statusCode =
        typeof err.statusCode === "number" &&
        Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode <= 599
            ? err.statusCode
            : 500;

    // Log error details on the server only.
    console.error({
        name: err.name,
        message: err.message,
        statusCode,
        method: req.method,
        path: req.originalUrl,
        stack: err.stack,
    });

    const isProduction = process.env.NODE_ENV === "production";

    // User-facing messages for common HTTP errors.
    const statusMessages: Record<number, string> = {
        400: "Invalid request. Please check your input.",
        401: "Authentication required. Please log in.",
        403: "You do not have permission to perform this action.",
        404: "The requested resource was not found.",
        405: "This request method is not allowed.",
        408: "The request timed out. Please try again.",
        409: "A conflict occurred with the current resource.",
        413: "The uploaded file or request is too large.",
        415: "The uploaded file or request type is not supported.",
        422: "The request could not be processed. Please check your input.",
        429: "Too many requests. Please try again later.",
        500: "Something went wrong. Please try again later.",
        501: "This functionality is not supported.",
        502: "An external service returned an invalid response.",
        503: "The service is temporarily unavailable.",
        504: "The service took too long to respond.",
    };

    const message =
        err.isOperational === true
            ? err.message
            : !isProduction && err.message
                ? err.message
                : statusMessages[statusCode] ??
                  "Something went wrong. Please try again later.";

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export default errorHandler;