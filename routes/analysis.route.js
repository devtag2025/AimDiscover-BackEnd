import { Router } from "express";
import { analyzeCategory} from "../controllers/analysis.controller.js";
import { get3DModelStatus } from "../controllers/analysis.controller.js";

import { proxyMeshyModel } from "../controllers/webhook.controller.js";
const router = Router();

router.post("/", analyzeCategory);
router.get("/3d-status/:taskId", get3DModelStatus); 
router.get("/3d-model/:taskId", proxyMeshyModel);

export default router;