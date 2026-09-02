import { body } from "express-validator";

export const validateRegister = [
    body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),


    body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),


    body("password")
        .trim()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    body("role")
        .trim()
        .isIn(["USER", "ORGANIZER", "ADMIN"])
        .withMessage("Role must be USER, ORGANIZER, or ADMIN")
];

export const validateLogin = [
    body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),

    
    body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
];