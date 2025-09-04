// async error handler wrapper.
// Problem: async errors in Express
//In Express, if you write an async route handler and an error happens, you usually need to wrap it in try/catch:
//👉 Without try/catch, an unhandled promise rejection will crash your app.
// But writing try/catch in every route = boring + repetitive. 😩

// Solution: asyncHandler->You created a higher-order function (a function that takes another function as input).

const asyncHandler = (requestHandler) => {
  // it taked fn as input and return fn as input
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
