import { GrokService } from "../services/grok.service.js";
export const GrokController = {
 async saveGrokAnalysis(req, res, next) {
  try {
    const data = req.body;


    const missing = [];
    if (!data?.products) missing.push("products");
    if (!data?.categories) missing.push("categories");
    if (!data?.keywords) missing.push("keywords");
    if (!data?.markets) missing.push("markets");
    if (!data?.summary) missing.push("summary");
    if (!data?.platforms) missing.push("platforms");
    if (!data?.sentiment) missing.push("sentiment");
    if (!data?.assumptions_global) missing.push("assumptions_global");

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Invalid data structure",
        missing,
      });
    }
    console.log(data)

    const insight = await GrokService.CreateAnalysis(data);

    return res
      .status(201)
      .json({ message: "Grok insights saved successfully", insight });
  } catch (err) {
    console.error("Error saving Grok insights:", err);
    next(err);
  }
},


  async getLatestInsights(_req, res, next) {
    try {
        const latest = await GrokService.LatestInsights()

      if (!latest)
        return res.status(404).json({ message: "No insights found" });

      res.status(200).json(latest);
    } catch (error) {

        console.error("Error fetching latest insight:", error);
      next(error);
    }
  },
};
