import axios from "axios";
import { GrokService } from "../services/grok.service.js";
export const GrokController = {
  async saveGrokAnalysis(req, res, next) {
    try {
      const data = req.body;

      if (
        !data.products ||
        !data.categories ||
        !data.keywords ||
        !data.markets ||
        !data.summary
      ) {
        return res.status(400).json({ message: "Invalid data structure" });
      }

      const insight = await GrokService.CreateAnalysis({
        products: data.products,
        categories: data.categories,
        keywords: data.keywords,
        markets: data.markets,
        summary: data.summary,
      });

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
