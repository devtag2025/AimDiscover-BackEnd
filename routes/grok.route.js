import { Router } from "express";
import { GrokController } from "../controllers/grok.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth)

router.get('/',GrokController.getLatestInsights)

export default router;