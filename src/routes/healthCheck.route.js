import { Router } from "express";
import { healthCheck } from "../controllers/healthCheck.controllers.js";
const router = Router();
router.route("/").get(healthCheck); // i.e /api/v1/healthcheck/ 
export default router;
