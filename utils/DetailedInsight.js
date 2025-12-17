import axios from "axios";
import { env } from "../config/env.config.js";
import { DETAILED_INSIGHT_PROMPT } from "./GrokAnalysisPrompt.js";

const GROK_API_KEY = env.GROK_API_KEY;

export async function generateDetailedInsight(grokInsight, analysisParams) {
  try {
    console.log("Generating detailed insight with params:", analysisParams);

    // Destructure all parameters with defaults
    const {
      // Product & Niche
      category = "Home & Kitchen",
      productType = "Non-Electronic Only",
      sizeConstraint = "Small (under 12×9×6 inches, <2 lbs)",
      gatedPreference = "Avoid All Gated",
      seasonality = "Evergreen",
      
      // Financials
      maxCogs = 7,
      minRetailPrice = 30,
      minMargin = 70,
      maxStartup = 15000,
      maxCAC = 8,
      minCLV = 100,
      
      // Market & Demand
      region = "North America",
      minMarketSize = 200,
      minGrowth = 20,
      minSearchVolume = 15000,
      minVirality = 750000,
      platformFocus = "All Platforms",
      
      // Competition
      maxCompetition = 35,
      maxAmazonListings = 75,
      maxDTCBrands = 50,
      
      // Supply Chain
      maxMOQ = 300,
      maxLeadTime = 6,
      supplierCerts = "Basic (ISO/BSCI)",
      
      // Other
      numberOfProducts = 3,
      riskTolerance = "Low",
      outputDetail = "Detailed"
    } = analysisParams;

    // Replace all placeholders in the prompt
    const customizedPrompt = DETAILED_INSIGHT_PROMPT
      // Product & Niche
      .replace(/\[CATEGORY\]/g, category)
      .replace(/\[PRODUCT_TYPE\]/g, productType)
      .replace(/\[SIZE_CONSTRAINT\]/g, sizeConstraint)
      .replace(/\[GATED_PREFERENCE\]/g, gatedPreference)
      .replace(/\[SEASONALITY\]/g, seasonality)
      
      // Financials
      .replace(/\[MAX_COGS\]/g, maxCogs)
      .replace(/\[MIN_RETAIL_PRICE\]/g, minRetailPrice)
      .replace(/\[MIN_MARGIN\]/g, minMargin)
      .replace(/\[MAX_STARTUP\]/g, maxStartup)
      .replace(/\[MAX_CAC\]/g, maxCAC)
      .replace(/\[MIN_CLV\]/g, minCLV)
      
      // Market & Demand
      .replace(/\[REGION\]/g, region)
      .replace(/\[MIN_MARKET_SIZE\]/g, minMarketSize)
      .replace(/\[MIN_GROWTH\]/g, minGrowth)
      .replace(/\[MIN_SEARCH_VOLUME\]/g, minSearchVolume)
      .replace(/\[MIN_VIRALITY\]/g, minVirality)
      .replace(/\[PLATFORM_FOCUS\]/g, platformFocus)
      
      // Competition
      .replace(/\[MAX_COMPETITION\]/g, maxCompetition)
      .replace(/\[MAX_AMAZON_LISTINGS\]/g, maxAmazonListings)
      .replace(/\[MAX_DTC_BRANDS\]/g, maxDTCBrands)
      
      // Supply Chain
      .replace(/\[MAX_MOQ\]/g, maxMOQ)
      .replace(/\[MAX_LEAD_TIME\]/g, maxLeadTime)
      .replace(/\[SUPPLIER_CERTS\]/g, supplierCerts)
      
      // Other
      .replace(/\[NUMBER_OF_PRODUCTS\]/g, numberOfProducts)
      .replace(/\[RISK_TOLERANCE\]/g, riskTolerance)
      .replace(/\[OUTPUT_DETAIL\]/g, outputDetail);

    // Add user-defined hard constraints
    const systemPromptWithConstraints = `
${customizedPrompt}

---

## USER-DEFINED HARD CONSTRAINTS (OVERRIDE ALL DEFAULTS)

### CRITICAL PARAMETERS TO ENFORCE:

**PRODUCT & NICHE:**
- Product Type: ${productType}
- Size Constraint: ${sizeConstraint}
- Gated Categories: ${gatedPreference}
- Seasonality: ${seasonality}

**FINANCIALS (NON-NEGOTIABLE):**
- Max COGS: **$${maxCogs} per unit fully landed to ${region}** (THIS IS THE ABSOLUTE CEILING)
- Min Retail Price: **$${minRetailPrice}+**
- Min Gross Margin: **${minMargin}%+** after all fees
- Max Startup Costs: **$${maxStartup}**
- Max CAC: **$${maxCAC}**
- Min CLV: **$${minCLV}+**

**MARKET & DEMAND:**
- Target Region: **${region}** (prioritize this region's data)
- Min Market Size: **$${minMarketSize}M+ annually**
- Min YoY Growth: **${minGrowth}%+**
- Min Monthly Search Volume: **${minSearchVolume}+**
- Min Social Virality: **${minVirality}+ views/month**
- Platform Focus: **${platformFocus}**

**COMPETITION:**
- Max Competition Index: **${maxCompetition}%**
- Max Amazon Listings: **${maxAmazonListings}**
- Max DTC Brands: **${maxDTCBrands}**

**SUPPLY CHAIN:**
- Max MOQ: **${maxMOQ} units**
- Max Lead Time: **${maxLeadTime} weeks**
- Supplier Certifications: **${supplierCerts}**

**OUTPUT REQUIREMENTS:**
- Number of Products to Recommend: **${numberOfProducts}**
- Risk Tolerance: **${riskTolerance}**
- Output Detail Level: **${outputDetail}**

### CRITICAL INSTRUCTIONS:
1. **DO NOT recommend ANY product that violates the Max COGS of $${maxCogs}**
2. **ALL ${numberOfProducts} products MUST meet the constraints above**
3. **If ${riskTolerance} is "Low", only recommend proven, validated products**
4. **Tailor depth of analysis to "${outputDetail}" level**
5. **Focus exclusively on ${region} market data and opportunities**

If ANY product cannot meet these constraints, explicitly state which constraint it violates and DO NOT include it in your recommendations.
`;

    const userPrompt = `Provide a comprehensive market analysis for the following trending product insight.

**TARGET REGION:** ${region}
**ANALYSIS DEPTH:** ${outputDetail}
**NUMBER OF PRODUCTS REQUESTED:** ${numberOfProducts}

Apply ALL user-defined constraints strictly. Do not recommend products that violate any constraint.

**PRODUCT INSIGHT:**
${grokInsight}

**CRITICAL REMINDERS:**
- Max COGS MUST be ≤$${maxCogs} fully landed to ${region}
- Min retail price MUST be ≥$${minRetailPrice}
- Min gross margin MUST be ≥${minMargin}%
- Return EXACTLY ${numberOfProducts} qualifying product(s)
- Tailor all insights specifically for the ${region} market
- Respect ${productType} preference
- Honor ${sizeConstraint} size restrictions
- Follow ${gatedPreference} category guidance
- Align with ${seasonality} seasonality preference
`;

    // Determine max tokens based on output detail
    const maxTokens = 
      outputDetail === "Comprehensive" ? 8000 : 
      outputDetail === "Detailed" ? 5500 : 
      3000;

    console.log(`🔧 API Configuration:`);
    console.log(`- Max Tokens: ${maxTokens}`);
    console.log(`- Region: ${region}`);
    console.log(`- Max COGS: $${maxCogs}`);
    console.log(`- Products: ${numberOfProducts}`);
    console.log(`- Detail Level: ${outputDetail}`);

    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content: systemPromptWithConstraints,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        model: "grok-3",
        max_tokens: maxTokens,
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

    console.log("✅ Grok response received, length:", detailedInsight.length);

    return {
      success: true,
      insight: detailedInsight,
      model: data.model,
      usage: data.usage,
      appliedConstraints: analysisParams, 
    };
  } catch (error) {
    console.error("❌ Error calling Grok API:", error.message);
    throw error;
  }
}