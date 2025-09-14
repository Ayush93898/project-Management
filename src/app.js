// so we this file for , as node js me , kaafi gichpich hori thi
// though we use express here and routing here
// and simple export
// and then listen on the index.js

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// express server
const app = express();
app.use(cookieParser());


// basic configuration
app.use(express.json({ limit: "16kb" })); // handles API JSON data.
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // handles form submissions.
app.use(express.static("public")); // handles form submissions.

// cors configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

// import the rotes

// healthCheck route
import healthCheckRouter from "./routes/healthCheck.route.js";
import authRouter from "./routes/auth.routes.js";

// /api/v1/healthcheck is home route
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter); // /api/v1/auth??? check PRD

app.get("/", (req, res) => {
  res.send("Welcome to Project Management App!");
});
app.get("/instagram", (req, res) => {
  res.send("Welcome to instagram App!");
});

export default app;
