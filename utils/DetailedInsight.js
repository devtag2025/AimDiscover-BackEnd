import axios from "axios";
import { env } from "../config/env.config.js";
import { DETAILED_INSIGHT_PROMPT } from "./GrokAnalysisPrompt.js";
const GROK_API_KEY = env.GROK_API_KEY;



export async function generateDetailedInsight(grokInsight) {
  try {
    console.log("Generating detailed insight for:", grokInsight);

    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content: DETAILED_INSIGHT_PROMPT,
          },
          {
            role: "user",
            content: `Provide a comprehensive market analysis for the following trending product:\n\n${grokInsight}`,
          },
        ],
        model: "grok-3",
        max_tokens: 2500,
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