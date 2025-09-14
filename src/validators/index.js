// i writr val for registration only
import { body } from "express-validator"; // as mostly data body se aare hai
// step -2 validation
// for registration
const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required") // agr empty hua (i.e !notEmpty) toh ye peice of code run hoga
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be in lowercase")
      .isLength({ min: 3 })
      .withMessage("Username must be atleat must be 3 characters long"),
    body("password").trim().isEmpty().withMessage("Password is required"),
    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("fullName is requierd")
      .optional()
      .trim(),
  ];
};

// for login
const userLoginValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Email is invalid"),
    body("password").notEmpty().withMessage("password is required"),
  ];
};

// change current password validatior
const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPasswod").notEmpty().withMessage("Old password is required"),
  ];
};

// user forgot password validator
const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

// user reset forgot password
const userResetForgotPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("password is required")];
};
export {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
};
