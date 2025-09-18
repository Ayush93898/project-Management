import { ApiResponse } from "../utils/api-response.js";

// const healthCheck = (req, res) => {
//   try {
//     res
//       .status(200)
//       .json(new ApiResponse(200, { message: "Server is running" }));
//   } catch (error) {}
// };  // problrm is we cannot use the try catch everywhere it is overwhelming

import { asyncHandler } from "../utils/async-handler.js"; // importing the asyncHandler

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200)
  .json(
    new ApiResponse(200, { message: "Server is absoluetly healthy " }),
  );
});
export { healthCheck };
