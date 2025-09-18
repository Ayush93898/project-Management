// in this file we write the user schema
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    avatar: {
      type: {
        url: String,
        localPath: String, // like locally kaha store karke rakhne wale h
      },
      default: {
        url: `https://placehold.co/200x200`, //placeholder image generator.
        localPath: "", // empty
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    fullName: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required bro"],
      
    },
    isEmailVerified: {
      type: Boolean,
      default: false, // as nobody will be verified by default
    },
    refreshToken: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationTokenExpiry: {
      type: Date,
    },
  },
  { timestamps: true },
); // by timeStamps: two more field avail i.e createdAt and updatedAt

// mongoose also allowed to write methods and hooks
// so whole thing (user model, some methods, hooks) constitutes a schema
// for hook
// like mughe schema me koi field save karni h, eg password..toh there are two hooks in the mongooose , post and pre hooks , as the name suggest if i have to do before saving then i use the pre hook if not then post hook
// so in case of the pasword i use the pre hook so that before saving them into the db i hashed the password

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next(); // tell mongoose we're done, continue saving
});

// lets understand few things
// 1- save is mongoose event name like something.save
// 2- so when save anything this hook trigger and it re-hash the password, so this.isModified("fieldName") inside hooks → it checks whether a field has been newly set or changed.

// method - to comapre jo pass maine daala hai wo shi h ya nhi
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//methods to create the tokens
// case 1 - with the data (using JSONWEBTOKEN)

// access token (who use this mtd gets back the token)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    // infromation(payload) + secret + exp time
    {
      // payload
      _id: this._id, // from the db
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

// refresh token (who use this mtd gets back the token)
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    // infromation(payload) + secret + exp time
    {
      _id: this._id, // from the db
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};

// case 2 - without the data (using crypto module of node js)
// are temp tokens use for verifying the user,pass reset
// temporary token

userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  // store as Date, not number
  const tokenExpiry = new Date(Date.now() + 20 * 60 * 1000);

  return { unHashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);
