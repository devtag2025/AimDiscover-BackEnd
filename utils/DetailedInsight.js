import axios from "axios";
import { env } from "../config/env.config.js";
import { DETAILED_INSIGHT_PROMPT } from "./GrokAnalysisPrompt.js";
const GROK_API_KEY = env.GROK_API_KEY;

export async function generateDetailedInsight(grokInsight, region,cogs){
  try {
    console.log("Generating detailed insight for:", grokInsight, "cogs:", cogs);

    const systemPromptWithCogs = `
${DETAILED_INSIGHT_PROMPT}

---

ADDITIONAL HARD CONSTRAINT (USER-DEFINED):

- The maximum allowed **fully landed COGS** must be treated as **$${cogs} per unit** to **${region}**, based on the user's selection.
- If any part of the above prompt conflicts with this, **prefer the user-defined COGS ceiling** of **$${cogs}**.
`;

    const userPrompt = `Provide a comprehensive market analysis for the following trending product.

TARGET REGION: ${region}
MAX TARGET COGS (USER SELECTION): $${cogs} per unit fully landed to ${region}.

Tailor all insights, pricing, platforms, logistics, and recommendations specifically for the ${region} market.

PRODUCT INFORMATION:
${grokInsight}
`;

    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content: systemPromptWithCogs,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        model: "grok-3",
        max_tokens: 5500,
        stream: false,
        temperature: 0.6,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROK_API_KEY}`,
        },
        validateStatus: () => true,
      }
    );

    console.log("Grok API Status:", response.status);

    if (response.status < 200 || response.status >= 300) {
      console.error("Grok API Error:", response.status, response.data);
      throw new Error(
        `Grok API error: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    const data = response.data;
    const detailedInsight =
      data.choices?.[0]?.message?.content || "No analysis generated";

    console.log("Grok response received, length:", detailedInsight.length);
    console.log("These are the Grok Detailed Insight", detailedInsight);

    return {
      success: true,
      insight: detailedInsight,
      model: data.model,
      usage: data.usage,
    };
  } catch (error) {
    console.error("Error calling Grok API:", error.message);
    throw error;
  }
}
