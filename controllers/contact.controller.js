import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "../services/email.service.js";

export const contactController = {
  async sendSupportMail(req, res, next) {
    try {
      const data = req.body;
      const { firstname, lastname, email, subject, message } = data;

      if (!firstname || !lastname || !email || !subject || !message) {
        throw new ApiError(400, "Data from all the fields is required");
      }


      await emailService.contactSupportService(data);

      res
        .status(201)
        .json(new ApiResponse(201, "Mail send.Please wait for Admin response"));
    } catch (error) {
      console.error(" Error creating category:", error);
      next(error);
    }
  },
};
