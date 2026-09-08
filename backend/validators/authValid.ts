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
  .notEmpty()
  .withMessage("Password is required")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number")
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage("Password must contain at least one special character"),


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


export const validatePassword = [
    body("newPassword")
    .trim()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol"
    )
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password cannot be the same as current password");
      }
      return true;
    }),

    body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Please confirm your password")

    .custom((value, {req}) => {
        if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
]