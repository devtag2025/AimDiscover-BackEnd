


// import { env } from "../config/env.config.js";

// const GROK_API_KEY = env.GROK_API_KEY;

// const MESHY_3D_SYSTEM_PROMPT = `You are an expert 3D modeling prompt engineer for Meshy API text-to-3D generation.

// OUTPUT FORMAT (respond with EXACTLY this structure, no other text):
// ---
// MESH_PROMPT: [your 3D prompt here, max 450 characters]
// ---
// DESCRIPTION: [your product description here, 2-3 sentences]
// ---

// CRITICAL 3D MODELING RULES:

// ASYMMETRY & COMPONENT PLACEMENT:
// - ALWAYS specify which side/face components are on: "on the bottom edge only", "right side only", "front face only"
// - Use directional terms: top, bottom, left, right, front, back, single, one
// - Prevent mirroring: "charging port centered on bottom edge, no ports on top"
// - For phones/devices: "screen on front face only, solid back panel"

// SURFACES & SCREENS:
// - Screens: "glossy black glass display surface" NOT "white screen"
// - Glass: "reflective dark glass panel with subtle edge reflection"
// - Displays: "recessed black screen area with thin bezels"

// MESH PROMPT STRUCTURE (follow this exact order):
// 1. OBJECT IDENTITY: "[Product type], [form factor]"
// 2. PRIMARY SHAPE: overall silhouette, dimensions ratio (e.g., "tall rectangular slab, 3:1 height-to-width ratio")
// 3. FRONT FACE: what's visible from front (screen, display, controls)
// 4. BACK FACE: what's on the rear (solid, textured, camera placement)
// 5. EDGES & SIDES: left/right/top/bottom edge details with SPECIFIC placement
// 6. MATERIALS: primary and secondary materials with finishes
// 7. COLORS: specific color values or descriptions

// MANDATORY INCLUSIONS:
// - Exact placement: "centered", "offset to left", "top-right corner"
// - Single vs multiple: "single camera lens", "one speaker grille"
// - Negative space: "no visible seams on back", "uninterrupted front glass"
// - Edge treatment: "rounded corners with 8mm radius", "chamfered edges"

// PRODUCT-SPECIFIC RULES:

// SMARTPHONES/TABLETS:
// - "Front: edge-to-edge glossy black glass display, thin black bezels"
// - "Back: solid [material] panel, camera module top-left corner only"
// - "Bottom edge: single centered charging port, speaker grilles flanking port"
// - "Right edge: volume buttons upper third, power button middle"
// - "No ports or buttons on left edge or top edge"

// APPLIANCES:
// - Specify control panel location: "controls on front top section"
// - Door/lid hinge side: "door hinged on left, handle on right"

// FURNITURE:
// - Leg placement: "four legs at corners" or "central pedestal base"
// - Symmetry where appropriate: "symmetrical armrests"

// ELECTRONICS:
// - Port clusters: "all ports on rear panel only"
// - Ventilation: "vent grilles on sides only, solid top"

// AVOID:
// - Generic terms without placement: "has a port" → "USB-C port centered on bottom edge"
// - Ambiguous sides: "buttons on the side" → "buttons on right edge only"
// - White/blank screens: always use "black glass display" or "dark screen surface"
// - Mirrored features: explicitly state single-sided placement

// DESCRIPTION RULES:
// - 2-3 sentences describing the product for e-commerce/catalog use
// - Include: what it is, key features, target use case
// - Professional tone, no marketing fluff`;

// async function analyzeWithGrok(categoryName, region, productName = null) {
//   try {
//     console.log("\n=== CALLING GROK API FOR MESHY PROMPT ===");
//     console.log("Category:", categoryName);
//     console.log("Region:", region);
//     console.log("Product:", productName || "Not specified");

//     const userPrompt = productName
//       ? `Generate a Meshy text-to-3D prompt and product description for: "${productName}"
// Category: "${categoryName}"
// Market: ${region}

// Remember:
// - Specify EXACT placement for all components (which edge, which corner, which face)
// - Prevent symmetry issues by stating "only" or "single" where needed
// - Screens must be black/dark glass, never white
// - Follow the exact output format with MESH_PROMPT and DESCRIPTION sections`
//       : `Generate a Meshy text-to-3D prompt and product description for a typical product in: "${categoryName}"
// Market: ${region}

// Remember:
// - Specify EXACT placement for all components (which edge, which corner, which face)
// - Prevent symmetry issues by stating "only" or "single" where needed
// - Follow the exact output format with MESH_PROMPT and DESCRIPTION sections`;

//     const response = await fetch("https://api.x.ai/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${GROK_API_KEY}`,
//       },
//       body: JSON.stringify({
//         messages: [
//           {
//             role: "system",
//             content: MESHY_3D_SYSTEM_PROMPT,
//           },
//           {
//             role: "user",
//             content: userPrompt,
//           },
//         ],
//         model: "grok-3",
//         max_tokens: 600,
//         stream: false,
//         temperature: 0.15,
//       }),
//     });

//     console.log("Grok API Status:", response.status);

//     if (!response.ok) {
//       const error = await response.text();
//       console.error("Grok API Error:", response.status, error);
//       throw new Error(`Grok API error: ${response.status} - ${error}`);
//     }

//     const data = await response.json();
//     const rawContent = data.choices?.[0]?.message?.content || "";

//     // Parse the structured response
//     const meshPromptMatch = rawContent.match(/MESH_PROMPT:\s*([\s\S]*?)(?=---|\nDESCRIPTION:|$)/i);
//     const descriptionMatch = rawContent.match(/DESCRIPTION:\s*([\s\S]*?)(?=---|$)/i);

//     let analysis = meshPromptMatch 
//       ? meshPromptMatch[1].trim() 
//       : rawContent.trim();
    
//     let description = descriptionMatch 
//       ? descriptionMatch[1].trim() 
//       : "";

//     // Clean up the mesh prompt
//     analysis = analysis
//       .replace(/^["']|["']$/g, "")
//       .replace(/^---+/gm, "")
//       .replace(/\n/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();

//     // Clean up description
//     description = description
//       .replace(/^["']|["']$/g, "")
//       .replace(/^---+/gm, "")
//       .trim();

//     // Ensure within Meshy limit
//     if (analysis.length > 450) {
//       // Try to cut at last complete sentence
//       const truncated = analysis.substring(0, 447);
//       const lastPeriod = truncated.lastIndexOf(".");
//       analysis = lastPeriod > 350 
//         ? truncated.substring(0, lastPeriod + 1)
//         : truncated + "...";
//     }

//     console.log("Meshy prompt generated, length:", analysis.length);
//     console.log("Prompt:", analysis);
//     console.log("Description:", description);

//     return {
//       success: true,
//       analysis,        
//       description,     
//       model: data.model,
//       usage: data.usage,
//     };
//   } catch (error) {
//     console.error("Error calling Grok API:", error.message);
//     throw error;
//   }
// }

// export default analyzeWithGrok;


import { env } from "../config/env.config.js";

const GROK_API_KEY = env.GROK_API_KEY;

const MESHY_3D_SYSTEM_PROMPT = `You are an expert 3D modeling prompt engineer for Meshy API text-to-3D generation.

OUTPUT FORMAT (respond with EXACTLY this structure, no other text):
---
MESH_PROMPT: [your 3D prompt here, max 450 characters]
---
DESCRIPTION: [your product description here, 2-3 sentences]
---

CRITICAL 3D MODELING RULES:

ASYMMETRY & COMPONENT PLACEMENT:
- ALWAYS specify which side/face components are on: "on the bottom edge only", "right side only", "front face only"
- Use directional terms: top, bottom, left, right, front, back, single, one
- Prevent mirroring: "charging port centered on bottom edge, no ports on top"
- For phones/devices: "screen on front face only, solid back panel"

SURFACES & SCREENS:
- Screens: "glossy black glass display surface" NOT "white screen"
- Glass: "reflective dark glass panel with subtle edge reflection"
- Displays: "recessed black screen area with thin bezels"

MESH PROMPT STRUCTURE (follow this exact order):
1. OBJECT IDENTITY: "[Product type], [form factor]"
2. PRIMARY SHAPE: overall silhouette, dimensions ratio (e.g., "tall rectangular slab, 3:1 height-to-width ratio")
3. FRONT FACE: what's visible from front (screen, display, controls)
4. BACK FACE: what's on the rear (solid, textured, camera placement)
5. EDGES & SIDES: left/right/top/bottom edge details with SPECIFIC placement
6. MATERIALS: primary and secondary materials with finishes
7. COLORS: specific color values or descriptions
8. DETAILS: buttons, ports, with exact positions`;

async function analyzeWithGrok(
  categoryName, 
  region, 
  productName = null,
  refinementContext = null  
) {
  try {
    console.log("\n🔵 === CALLING GROK API ===");
    console.log("Category:", categoryName);
    console.log("Region:", region);
    console.log("Product Name:", productName || "None");
    console.log("Refinement Context:", refinementContext ? "Provided" : "None");

    // Build base prompt
    const basePrompt = productName
      ? `Generate a Meshy text-to-3D prompt and product description for: "${productName}"
Category: "${categoryName}"
Market: ${region}`
      : `Generate a Meshy text-to-3D prompt and product description for a typical product in: "${categoryName}"
Market: ${region}`;

    let fullPrompt = basePrompt;
    
    if (refinementContext && refinementContext.trim()) {
      fullPrompt = `${basePrompt}

**USER'S SPECIFIC REQUIREMENTS:**
${refinementContext.trim()}

IMPORTANT: Please incorporate the user's specific requirements above into your product selection and description. The user has refined their search with these additional criteria.`;
    }

    const userPrompt = `${fullPrompt}

Remember:
- Incorporate any user-specific requirements if mentioned above
- Specify EXACT placement for all components (which edge, which corner, which face)
- Prevent symmetry issues by stating "only" or "single" where needed
- Screens must be black/dark glass, never white
- Follow the exact output format with MESH_PROMPT and DESCRIPTION sections`;

    console.log("\n📤 Sending request to Grok API...");

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: MESHY_3D_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        model: "grok-3",
        max_tokens: 600,
        stream: false,
        temperature: 0.15,
      }),
    });

    console.log("Grok API Status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Grok API Error:", response.status, error);
      throw new Error(`Grok API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse the structured response
    const meshPromptMatch = rawContent.match(/MESH_PROMPT:\s*([\s\S]*?)(?=---|\nDESCRIPTION:|$)/i);
    const descriptionMatch = rawContent.match(/DESCRIPTION:\s*([\s\S]*?)(?=---|$)/i);

    let analysis = meshPromptMatch 
      ? meshPromptMatch[1].trim() 
      : rawContent.trim();
    
    let description = descriptionMatch 
      ? descriptionMatch[1].trim() 
      : "";

    // Clean up the mesh prompt
    analysis = analysis
      .replace(/^["']|["']$/g, "")
      .replace(/^---+/gm, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Clean up description
    description = description
      .replace(/^["']|["']$/g, "")
      .replace(/^---+/gm, "")
      .trim();

    // Ensure within Meshy limit
    if (analysis.length > 450) {
      const truncated = analysis.substring(0, 447);
      const lastPeriod = truncated.lastIndexOf(".");
      analysis = lastPeriod > 350 
        ? truncated.substring(0, lastPeriod + 1)
        : truncated + "...";
    }

    console.log("✅ Meshy prompt generated, length:", analysis.length);
    console.log("📝 Prompt:", analysis);
    console.log("📄 Description:", description);

    return {
      success: true,
      analysis,        
      description,     
      model: data.model,
      usage: data.usage,
    };
  } catch (error) {
    console.error("❌ Error calling Grok API:", error.message);
    throw error;
  }
}

export default analyzeWithGrok;