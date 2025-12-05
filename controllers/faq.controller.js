import { FaqSerivce } from "../services/faq.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const faqController = {
  async getFaqs(_req, res, next) {
    try {
      const data = await FaqSerivce.getFaqGrouped();
      res
        .status(200)
        .json(new ApiResponse(200, data, "Successfuly retreived all the Faqs"));
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  async createFaqs(req, res, next) {
    try {
      const data = req.body;
      const { category, question, answer, sort_order, is_active } = data;
      if (!category || !question || !answer || !sort_order || !is_active) {
        res.status(400).json(new ApiResponse(400, "Credentials is missing"));
      }

      const created = await FaqSerivce.createFaqEntry(data);
      res
        .status(201)
        .json(new ApiResponse(201, created, "Faqs are created  sucessfully"));
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
};
