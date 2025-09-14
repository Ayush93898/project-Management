import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-errors.js";
// part 1 - middleware
// method for validate
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extratedErrors = [];
  errors.array().map((err) =>
    extratedErrors.push({
      [err.path]: err.msg,
    }),
  );
  throw new ApiError(409, "Recieved data is not valid", extratedErrors);
};
