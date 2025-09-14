// auth controller
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-errors.js";
import {
  emailVerificationMailGenContent,
  forgotPasswordMailGenContent,
  sendEmail,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";

// method to create generate and access tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // as in model we have ref token as a field,so we can save it in the db(not AT)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // as i only touch only one field
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // we get the data from the body
  const { email, username, password, role } = req.body; // form ka data

  // validation - usko hum alag se likhege

  // check if user already exist in the db or not
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // agr dono me se ek bhi match ho jaye
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist", []);
  }

  // if not found the user then save into the db
  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });

  // once this happen now i want to send email to the user
  // now we generate the temp tokens, as we know that it use for the purpose like user verif..

  // so all the func we write in the User model wo user ke pass hai jo abhi humne upar banaya hai
  const { unHashedToken, HashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  // added them in db
  user.emailVerificationToken = HashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;

  //save
  user.save({ validateBeforeSave: false });

  // now i have to send an eamil so that same token sent to the user
  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailGenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`, // gen the dynamic link
    ),
  });

  // sending response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry",
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "user registered successfully and verification email has been sent on your email",
      ),
    );
});

// login controller
const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    throw new ApiError(404, "Username or email is required");
  }

  // finding the user on the basic of email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  // checking password
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid credentails");
  }

  // if password correct then generate the tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  // send token/data in cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry",
  );
  // cokkies have options
  const options = {
    httpOnly: true, //JS on the frontend CANNOT read this cookie
    secure: true, // only manipulated by the browser
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

// logout- controller
// refreshtoken ki ma behn ek kar do
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, // as we know it has AT so middleware give the req.user
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// current user
// req.user - as i.e protected route middleware work for it
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

//verify email
// http://localhost:3000/api/v1/users/verify-email/08c91864184539b2d6f0092d9a3a47099511b735 (i.e unhashed token)
// we use the params here

const verifyEmail = asyncHandler(async (req, res) => {
  // take the data
  const { verificationToken } = req.params;
  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }
  // hash the token (08c91864184539b2d6f0092d9a3a47099511b735)
  let hashedToken = crypto
    .createHash("sha256") // algo
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken, // emailVerificationToken -> that save in the db
    emailVerificationTokenExpiry: { $gt: Date.now() }, // writing condition
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  //cleanup
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  // verified and save the user
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  //sending the response back
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isEmailVerified: true,
      },
      "Email is verified",
    ),
  );
});

// resend the email verification

const resendEmailVerification = asyncHandler(async (req, res) => {
  // only for that user, that are logged-in
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verifies");
  }

  // if u r not verified then u have to repear whole process again, gen token and all
  const { unHashedToken, HashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.emailVerificationToken = HashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  user.save({ validateBeforeSave: false });

  // now i have to send an eamil so that same token sent to the user
  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailGenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`, // gen the dynamic link
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Mail has been sent to your email ID"));
});

// refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  // try to decode the infromation of ref token
  // {
  //   _id: this._id, // from the db
  // }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invaid refresh token");
    }

    // if its deocded it has also be in db
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }
    // refresh the token / generate the token
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    // update the db
    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

// forgot password
const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist", []);
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Passowrd reset request",
    mailgenContent: forgotPasswordMailGenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset mail has been sent on your email ID",
      ),
    );
});

// reset password
const resetForgotPassword = asyncHandler(async (req, res) => {
  // getting the data -- from params and body
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // now we find the user based on this
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }
  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password reset successfuly"));
});

//change password (u are already logged-in)

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const{ oldPassword, newPassword} = req.body
  const user = await User.findById(req.user?._id)

  // check whether is your old password is correct or not
  const isPasswordValid = await user.isPasswordCorrect(oldPassword,newPassword)
  if(!isPasswordValid){
    throw new ApiError(400, "Invalid old password")
  }
  user.password = password
  await user.save({validateBeforeSave:false})
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "password change successfully"
      )
    )
})
export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword
};
