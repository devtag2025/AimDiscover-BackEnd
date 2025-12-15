import { faqController } from "../controllers/faq.controller.js";
import { Router } from "express";
import { auth, authorize } from "../middlewares/index.js";

const router = Router();

router.get('/',faqController.getFaqs);
router.use(auth)
router.post('/', authorize(["admin"]),faqController.createFaqs)
router.get('/admin',authorize(["admin"]),faqController.getFaqAdmin)
router.put('/:id', authorize(["admin"]),faqController.updateFaqs)
router.delete('/:id', authorize(["admin"]),faqController.deleteFaq)
export default router;