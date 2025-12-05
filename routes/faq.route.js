import { faqController } from "../controllers/faq.controller.js";
import { Router } from "express";
import { auth, authorize } from "../middlewares/index.js";

const router = Router();

router.get('/',faqController.getFaqs);
router.use(auth)
router.post('/', authorize(["admin"]),faqController.createFaqs)
export default router;