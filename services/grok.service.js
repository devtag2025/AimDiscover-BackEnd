import { env } from "../config/env.config.js";
import db from "../db/connect.js";
import { insights } from "../schema/index.js";
import { createId } from "@paralleldrive/cuid2";
import axios from "axios";
import GROK_ANALYSIS_PROMPT from "../utils/GrokAnalysisPrompt.js";
import { desc } from "drizzle-orm";

export class GrokService {


  static async CreateAnalysis({
    products,
    categories,
    keywords,
    markets,
    summary,
  }) {
    console.log("create grok payload", products);
    console.log("create grok payload", categories);

  const cleaned = {
  id: createId(),
  summary: summary.slice(0, 500),
  products: JSON.parse(JSON.stringify(products)),
  categories: JSON.parse(JSON.stringify(categories)),
  keywords: JSON.parse(JSON.stringify(keywords)),
  markets: JSON.parse(JSON.stringify(markets)),
};


    const [insight] = await db
      .insert(insights)
      .values(cleaned)
      .returning();
    return insight;
  }

static async GetGrokInsights() {
  try {
//  const prompt = `
// Analyze the last 24 hours of global activity across:
// - X (Twitter)
// - Trending search activity
// - News coverage
// - Online discussions and forums
// - Web articles and blogs

// Generate a highly detailed TREND INTELLIGENCE REPORT.

// STRICT REQUIREMENTS:

// 1) Minimum 7 products MUST be included.
// 2) Each product MUST include:
//    - geographic trend breakdown (top 3-5 countries minimum)
//    - mention spike % estimate
//    - sentiment summary
//    - WHY it's trending
//    - timeline (approx when spike began)
//    - signal source strength (web vs X)
//    - category
//    - momentum score (1-100)

// 3) Data must be insightful and explanatory, NOT superficial.
// 4) MUST identify early-stage emerging trends.
// 5) MUST quantify hype strength.

// Return ONLY JSON in this EXACT structure:

// {
//   "summary": "",
//   "products": [
//     {
//       "name": "",
//       "category": "",
//       "momentum_score": 0,
//       "mention_spike_percent": 0,
//       "top_countries": [],
//       "sentiment": "",
//       "signals_from": {
//         "twitter": 0,
//         "web": 0,
//         "news": 0
//       },
//       "trend_reason": "",
//       "spike_started_at": ""
//     }
//   ],
//   "categories": [],
//   "keywords": [],
//   "markets": [],
//   "sentiment": {
//     "global_score": 0,
//     "remarks": ""
//   }
// }

// Ensure:
// - JSON ONLY
// - No text outside the JSON.
// `;

    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-3",   
        messages: [
          {
            role: "system",
            content: "You are an insights engine."
          },
          {
            role: "user",
            content: GROK_ANALYSIS_PROMPT
          }
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

    return JSON.parse(result);

  } catch (error) {
    console.error(
      "Error fetching Grok insights:",
      error.response?.data || error.message
    );
    throw error;
  }
}

  static async LatestInsights (){
  const start = Date.now();


const latest = await db
  .select()
  .from(insights)
  .orderBy(desc(insights.generatedAt))
  .limit(1);

  console.log('LatestInsights query took', Date.now() - start, 'ms');

  return latest[0] || null;
}

  }

