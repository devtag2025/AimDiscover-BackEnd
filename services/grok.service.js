// services/grok.service.js (Updated)

import { env } from "../config/env.config.js";
import db from "../db/connect.js";
import { insights } from "../schema/index.js";
import { createId } from "@paralleldrive/cuid2";
import axios from "axios";
import GROK_ANALYSIS_PROMPT from "../utils/GrokAnalysisPrompt.js";
import { desc } from "drizzle-orm";

export class GrokService {
  
  static async CreateAnalysis({ products, categories, keywords, markets, summary, platforms, sentiment }) {
    console.log("🔵 CreateAnalysis called with", products.length, "products");

    // Validate that products have the new detailed_analysis structure
    const validatedProducts = products.map(product => {
      if (!product.detailed_analysis) {
        console.warn(`⚠️ Product "${product.name}" missing detailed_analysis`);
        // Provide fallback empty structure to prevent errors
        product.detailed_analysis = {
          market_opportunity: {},
          competitive_landscape: {},
          buyer_persona: {},
          profit_analysis: {},
          supply_chain: {},
          marketing_strategy: {},
          risk_assessment: {},
          actionable_insights: {}
        };
      }
      return product;
    });

    // Clean and prepare data for PostgreSQL JSONB
    const cleaned = {
      id: createId(),
      summary: summary.slice(0, 1000), // Enforce varchar(1000) limit
      products: validatedProducts, // 🆕 Now includes detailed_analysis
      categories,
      keywords,
      markets,
      platforms: platforms || [],
      sentiment: sentiment || { global_score: 0, remarks: "" },
      assumptions_global: null, // Or add global assumptions if needed
    };

    try {
      const [insight] = await db
        .insert(insights)
        .values(cleaned)
        .returning();

      console.log("✅ Insight saved with ID:", insight.id);
      return insight;
    } catch (error) {
      console.error("❌ Error saving insight:", error);
      throw error;
    }
  }

  static async GetGrokInsights() {
    try {
      const response = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model: "grok-3",
          messages: [
            { role: "system", content: "You are an insights engine." },
            { role: "user", content: GROK_ANALYSIS_PROMPT }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${env.GROK_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const result = response.data?.choices?.[0]?.message?.content;
      
      // Parse JSON response
      const parsedResult = JSON.parse(result);

      // Validate structure
      if (!parsedResult.products || !Array.isArray(parsedResult.products)) {
        throw new Error("Invalid Grok response: missing products array");
      }

      // Check if products have detailed_analysis
      const hasDetailedAnalysis = parsedResult.products.every(p => p.detailed_analysis);
      if (!hasDetailedAnalysis) {
        console.warn("⚠️ Some products missing detailed_analysis");
      }

      return parsedResult;

    } catch (error) {
      console.error("Error fetching Grok insights:", error.response?.data || error.message);
      throw error;
    }
  }

  static async LatestInsights() {
    const start = Date.now();

    const latest = await db
      .select()
      .from(insights)
      .orderBy(desc(insights.generatedAt))
      .limit(1);

    console.log('LatestInsights query took', Date.now() - start, 'ms');

    return latest[0] || null;
  }

  // 🆕 NEW: Query products by criteria using JSONB operators
  static async SearchProducts({ minMomentum, category, country }) {
    const query = db
      .select()
      .from(insights)
      .orderBy(desc(insights.generatedAt))
      .limit(1);

    const [latestInsight] = await query;
    
    if (!latestInsight) return [];

    // Filter products in-memory (for now)
    // Later, can use PostgreSQL JSONB operators for server-side filtering
    let products = latestInsight.products;

    if (minMomentum) {
      products = products.filter(p => p.momentum_score >= minMomentum);
    }

    if (category) {
      products = products.filter(p => p.category.includes(category));
    }

    if (country) {
      products = products.filter(p => p.top_countries.includes(country));
    }

    return products;
  }

  // 🆕 NEW: Get product by name with full details
  static async GetProductDetails(productName) {
    const [latestInsight] = await db
      .select()
      .from(insights)
      .orderBy(desc(insights.generatedAt))
      .limit(1);

    if (!latestInsight) return null;

    const product = latestInsight.products.find(p => 
      p.name.toLowerCase() === productName.toLowerCase()
    );

    return product || null;
  }
}