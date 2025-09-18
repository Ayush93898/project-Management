// route for the auth controller
import { Router } from "express";
import {
  login,
  logoutUser,
  registerUser,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyEmail } from "../controllers/auth.controller.js";
import { refreshAccessToken } from "../controllers/auth.controller.js";
import { userForgotPasswordValidator } from "../validators/index.js";
import { forgotPasswordRequest } from "../controllers/auth.controller.js";
import { userResetForgotPasswordValidator } from "../validators/index.js";
import { resetForgotPassword } from "../controllers/auth.controller.js";
import { getCurrentUser } from "../controllers/auth.controller.js";
import { changeCurrentPassword } from "../controllers/auth.controller.js";
import { resendEmailVerification } from "../controllers/auth.controller.js";


const router = Router();
// s-3 routes so req goes to /regsiter to the mtd registerUser.. toh iske beech me khi insert karna hoga
// i.e userRegisterValidator se jo errors aaygi, wo validator catch karega.. . technically validate is pure middleware
// unsecure routes
router.route("/register").post(userRegisterValidator(), validate, registerUser); // /api/v1/auth/register
router.route("/login").post(userLoginValidator(), login); // /api/v1/auth/login
router.route("/verify-email/:verificationToken").get(verifyEmail); // /api/v1/auth/verify-email/token
router.route("/refresh-token").post(refreshAccessToken); // /api/v1/auth/refresh-token
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest); // /api/v1/auth/forgot-password
router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotPassword); // /api/v1/auth/reset-password

//secure route
router.route("/logout").post(verifyJWT, logoutUser); // /api/v1/auth/logout
router.route("/current-user").post(verifyJWT, getCurrentUser); // /api/v1/auth/current-user
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword,
  ); // /api/v1/auth/change-password
router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification); // /api/v1/auth/resend-email-verification

export default router;
