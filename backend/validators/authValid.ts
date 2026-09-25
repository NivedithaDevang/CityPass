import { body } from "express-validator";

export const validateRegister = [
    body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3})
    .withMessage("Name must be atleast 3 characters")
    .isLength({ max : 25})
    .withMessage("Name cannot exceed 25 characters"),



body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .contains("@")
  .withMessage("Email must contain an '@' symbol")
  .isEmail()
  .withMessage("Valid email is required")
  .normalizeEmail(),


    body("password")
  .notEmpty()
  .withMessage("Password is required")
  .isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  .withMessage(
    "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character"
  ),

body("confirmpassword")
  .notEmpty()
  .withMessage("Confirm password is required")
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  })


    // body("role")
    //     .trim()
    //     .isIn(["USER", "ORGANIZER", "ADMIN"])
    //     .withMessage("Role must be USER, ORGANIZER, or ADMIN")
];

export const validateLogin = [
    body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),

    
    body("password")
    .notEmpty()
    .withMessage("Password is required")
];


export const validatePassword = [
    body("newPassword")
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
    .notEmpty()
    .withMessage("Please confirm your password")

    .custom((value, {req}) => {
        if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
]