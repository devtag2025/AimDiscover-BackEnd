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

  async getFaqAdmin(_req,res,next){
 try {
      const data = await FaqSerivce.getFaqFlatForAdmin();
      res
        .status(200)
        .json(new ApiResponse(200, data, "Successfuly retreived all the Faqs for admin"));
    } catch (error) {
      console.error(error);
      next(error);
    }
  },


async createFaqs(req, res, next) {
  try {
    const { category, question, answer, sortOrder,isActive } = req.body;

    if (
      typeof category !== "string" ||
      typeof question !== "string" ||
      typeof answer !== "string"
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Category, question and answer are required"));
    }

    const created = await FaqSerivce.createFaqEntry({
      category,
      question,
      answer,
      sortOrder,
      isActive
    });

    return res
      .status(201)
      .json(new ApiResponse(201, created, "Faq created successfully"));
  } catch (error) {
    console.error(error);
    next(error);
  }
},

  async deleteFaq(req, res, next) {
    try {
     const id = Number(req.params.id); 

    if (!id || Number.isNaN(id)) {
      return res.status(400).json(new ApiResponse(400, "Invalid FAQ id"));
    }

    const deleted = await FaqSerivce.deleteFaq(id); 
      res
        .status(201)
        .json(new ApiResponse(201, deleted, "Faq is deleted  sucessfully"));
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

async updateFaqs(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json(new ApiResponse(400, "Invalid FAQ id"));
    }

    const { category, question, answer, sortOrder, isActive } = req.body;

    const data = {
      category,
      question,
      answer,
      sortOrder,
      isActive,
    };

    const updated = await FaqSerivce.updateFaqById(id, data);

    if (!updated) {
      return res.status(404).json(new ApiResponse(404, null, "FAQ not found"));
    }

    return res.status(200).json(new ApiResponse(200, updated, "FAQ updated successfully"));
  } catch (error) {
    if (error.code === "NO_FIELDS") {
      return res.status(400).json(new ApiResponse(400, null, "No fields provided to update"));
    }
    next(error);
  }
}


};
