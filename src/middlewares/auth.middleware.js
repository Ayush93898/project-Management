// so this middleware we write for checking whther u have access token or not
// Goal of this middleware (verifyJWT)
// To protect routes (like /profile, /dashboard) so that only logged-in users (those who have a valid accessToken) can access them.

import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-errors.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // acess the accessToken
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  // decode the token, and it have lots of information
  //  _id: this._id, // from the db
  //   email: this.email,
  //   username: this.username,

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry",
    );

    if (!user) {
      throw new ApiError(401, "invalid access token");
    }
    req.user = user; // adding additional property,  contains the logged-in user's data
    next();
  } catch (error) {
    throw new ApiError(401, "invalid access token");
  }
});
