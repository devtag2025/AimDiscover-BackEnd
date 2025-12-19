// import { Router } from "express";
// import { analyzeCategory} from "../controllers/analysis.controller.js";
// import { get3DModelStatus } from "../controllers/analysis.controller.js";

// import { proxyMeshyModel } from "../controllers/webhook.controller.js";
// const router = Router();

// router.post("/", analyzeCategory);
// router.get("/3d-status/:taskId", get3DModelStatus); 
// router.get("/3d-model/:taskId", proxyMeshyModel);

// export default router;


import { Router } from "express";
import { 
  analyzeCategory,           
  analyzeInsightsOnly,       
  generate3DFromPrompt,      
  get3DModelStatus           
} from "../controllers/analysis.controller.js";
import { proxyMeshyModel } from "../controllers/webhook.controller.js";

const router = Router();

// ========== NEW ENDPOINTS ==========
router.post("/insights", analyzeInsightsOnly);        // Generate insights (initial or refined)
router.post("/generate-3d", generate3DFromPrompt);    // Generate 3D model separately

// ========== EXISTING ENDPOINTS (unchanged) ==========
router.post("/", analyzeCategory);                    // Original full analysis (keep for backward compatibility)
router.get("/3d-status/:taskId", get3DModelStatus);   // Poll 3D generation status
router.get("/3d-model/:taskId", proxyMeshyModel);     // Fetch actual 3D model file

export default router;