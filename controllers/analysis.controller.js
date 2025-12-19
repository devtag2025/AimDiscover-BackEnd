import db from "../db/connect.js";
import { categories } from "../schema/category.js";
import { meshyTasks } from "../schema/meshy-tasks.js";
import { eq , or } from "drizzle-orm";
import analyzeWithGrok from "../utils/GrokAnalyze.js";
import generate3DModelWithMeshy from "../utils/Generate3D.js";
import { generateDetailedInsight } from "../utils/DetailedInsight.js";
export async function get3DModelStatus(req, res) {
  try {
    const { taskId } = req.params;

    console.log("\n🔍 === CHECKING TASK STATUS ===");
    console.log("🆔 Task ID:", taskId);

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    // ✅ Updated to use new schema fields
    const [task] = await db
      .select()
      .from(meshyTasks)
      .where(
        or(
          eq(meshyTasks.id, taskId),              // Primary ID
          eq(meshyTasks.previewTaskId, taskId),   // Preview task ID
          eq(meshyTasks.refineTaskId, taskId)     // Refine task ID
        )
      )
      .limit(1);

    if (!task) {
      console.log("❌ Task not found");
      return res.status(404).json({ error: "Task not found" });
    }

    console.log("\n📊 === RAW TASK DATA ===");
    console.log("ID:", task.id);
    console.log("PreviewTaskId:", task.previewTaskId);
    console.log("RefineTaskId:", task.refineTaskId);
    console.log("Stage:", task.stage);
    console.log("Status:", task.status);
    console.log("Progress:", task.progress);
    console.log("ModelUrls type:", typeof task.modelUrls);
    console.log("ModelUrls:", task.modelUrls);
    console.log("TextureUrls type:", typeof task.textureUrls);
    console.log("TextureUrls:", task.textureUrls);
    console.log("ThumbnailUrl:", task.thumbnailUrl);
    console.log("VideoUrl:", task.videoUrl);

    // Parse JSON fields (they should already be objects with JSONB, but handle strings just in case)
    let modelUrls = task.modelUrls;
    let textureUrls = task.textureUrls;

    if (typeof modelUrls === 'string') {
      try {
        modelUrls = JSON.parse(modelUrls);
        console.log("⚠️ modelUrls was string, parsed");
      } catch (e) {
        console.error("❌ Failed to parse modelUrls:", e);
        modelUrls = null;
      }
    }

    if (typeof textureUrls === 'string') {
      try {
        textureUrls = JSON.parse(textureUrls);
        console.log("⚠️ textureUrls was string, parsed");
      } catch (e) {
        console.error("❌ Failed to parse textureUrls:", e);
        textureUrls = null;
      }
    }

    console.log("\n✅ === PARSED DATA ===");
    console.log("Has modelUrls:", !!modelUrls);
    console.log("ModelUrls keys:", modelUrls ? Object.keys(modelUrls) : "none");
    console.log("Has textureUrls:", !!textureUrls);
    console.log("TextureUrls keys:", textureUrls ? Object.keys(textureUrls) : "none");

    // ✅ Determine completion status
    const hasModel = modelUrls && Object.keys(modelUrls).length > 0;
    const hasTextures = textureUrls && Object.keys(textureUrls).length > 0;
    const isFullyComplete = hasModel && hasTextures;

    console.log("\n🎯 === STATUS DETERMINATION ===");
    console.log("Current Stage:", task.stage);
    console.log("Has Model:", hasModel);
    console.log("Has Textures:", hasTextures);
    console.log("Fully Complete:", isFullyComplete);

    // Determine display status and message based on stage
    let actualStatus = task.status;
    let displayMessage = null;

    if (task.stage === "preview") {
      if (task.status === "PENDING") {
        displayMessage = "Waiting to start preview generation...";
      } else if (task.status === "IN_PROGRESS") {
        displayMessage = "Generating 3D model geometry...";
      } else if (task.status === "SUCCEEDED") {
        displayMessage = "Preview complete, starting texturing...";
        actualStatus = "IN_PROGRESS"; // Show as in progress until refine starts
      } else if (task.status === "FAILED") {
        displayMessage = "Preview generation failed";
      }
    } else if (task.stage === "refine") {
      if (task.status === "PENDING") {
        displayMessage = "Waiting to start texture generation...";
      } else if (task.status === "IN_PROGRESS" || task.status === "REFINING") {
        displayMessage = "Generating PBR textures (metallic, roughness, normal)...";
      } else if (task.status === "SUCCEEDED" && isFullyComplete) {
        displayMessage = "Complete with high-quality PBR textures!";
      } else if (task.status === "SUCCEEDED" && !isFullyComplete) {
        displayMessage = "Finalizing textures...";
        actualStatus = "IN_PROGRESS";
      } else if (task.status === "FAILED") {
        displayMessage = "Texture generation failed";
      }
    }

    // Handle special statuses
    if (task.status === "TIMEOUT") {
      displayMessage = "Generation timed out";
    } else if (task.status === "CANCELED") {
      displayMessage = "Generation was canceled";
    }

    const response = {
      // ✅ Return primary ID for client tracking
      id: task.id,
      previewTaskId: task.previewTaskId,
      refineTaskId: task.refineTaskId,
      
      // Status info
      status: actualStatus,
      stage: task.stage,
      progress: task.progress,
      message: displayMessage,
      
      // Model data
      modelUrls: modelUrls,
      textureUrls: textureUrls,
      thumbnailUrl: task.thumbnailUrl,
      videoUrl: task.videoUrl,
      
      // Metadata
      prompt: task.prompt,
      artStyle: task.artStyle,
      taskError: task.taskError,
      
      // Timestamps
      createdAt: task.createdAt,
      finishedAt: task.finishedAt,
      
      // Helper flags
      isFullyComplete: isFullyComplete,
      hasModel: hasModel,
      hasTextures: hasTextures,
      isRefined: isFullyComplete, 
    };

    console.log("\n📤 === RESPONSE ===");
    console.log("Sending status:", actualStatus);
    console.log("Stage:", task.stage);
    console.log("isFullyComplete:", isFullyComplete);
    console.log("hasTextures:", hasTextures);
    console.log("Message:", displayMessage);

    return res.status(200).json(response);

  } catch (error) {
    console.error("\n❌ === STATUS CHECK ERROR ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}

export async function analyzeCategory(req, res) {
  try {
    const { 
      categoryId, 
      productName, 
      artStyle = "realistic",
      
      // Product & Niche
      productType,
      sizeConstraint,
      gatedPreference,
      seasonality,
      
      // Financials
      maxCogs,
      minRetailPrice,
      minMargin,
      maxStartup,
      maxCAC,
      minCLV,
      
      // Market & Demand
      region,
      minMarketSize,
      minGrowth,
      minSearchVolume,
      minVirality,
      platformFocus,
      
      // Competition
      maxCompetition,
      maxAmazonListings,
      maxDTCBrands,
      
      // Supply Chain
      maxMOQ,
      maxLeadTime,
      supplierCerts,
      
      // Other
      numberOfProducts,
      riskTolerance,
      outputDetail
    } = req.body;

    console.log("\n🎯 === NEW ANALYSIS REQUEST ===");
    console.log("📦 Category ID:", categoryId);
    console.log("🌍 Region:", region || "Default");
    console.log("🏷️ Product Name:", productName || "Not specified");
    console.log("🎨 Art Style:", artStyle);
    console.log("💰 Max COGS:", maxCogs || "Default");

    // Validate only the truly required field
    if (!categoryId) {
      console.error("❌ Missing required field: categoryId");
      return res.status(400).json({
        success: false,
        message: "Category selection is required",
      });
    }

    // Get category details from database
    console.log("🔍 Fetching category from database...");
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      console.error("❌ Category not found:", categoryId);
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    console.log("✅ Category found:", category.name);

    // Build analysis parameters with defaults for any missing values
    const analysisParams = {
      // Product & Niche
      category: category.name,
      productType: productType || "Non-Electronic Only",
      sizeConstraint: sizeConstraint || "Small (under 12×9×6 inches, <2 lbs)",
      gatedPreference: gatedPreference || "Avoid All Gated",
      seasonality: seasonality || "Evergreen",
      
      // Financials (with fallback defaults)
      maxCogs: maxCogs !== undefined && maxCogs !== null ? maxCogs : 7,
      minRetailPrice: minRetailPrice !== undefined && minRetailPrice !== null ? minRetailPrice : 30,
      minMargin: minMargin !== undefined && minMargin !== null ? minMargin : 70,
      maxStartup: maxStartup !== undefined && maxStartup !== null ? maxStartup : 15000,
      maxCAC: maxCAC !== undefined && maxCAC !== null ? maxCAC : 8,
      minCLV: minCLV !== undefined && minCLV !== null ? minCLV : 100,
      
      // Market & Demand
      region: region || "North America",
      minMarketSize: minMarketSize !== undefined && minMarketSize !== null ? minMarketSize : 200,
      minGrowth: minGrowth !== undefined && minGrowth !== null ? minGrowth : 20,
      minSearchVolume: minSearchVolume !== undefined && minSearchVolume !== null ? minSearchVolume : 15000,
      minVirality: minVirality !== undefined && minVirality !== null ? minVirality : 750000,
      platformFocus: platformFocus || "All Platforms",
      
      // Competition
      maxCompetition: maxCompetition !== undefined && maxCompetition !== null ? maxCompetition : 35,
      maxAmazonListings: maxAmazonListings !== undefined && maxAmazonListings !== null ? maxAmazonListings : 75,
      maxDTCBrands: maxDTCBrands !== undefined && maxDTCBrands !== null ? maxDTCBrands : 50,
      
      // Supply Chain
      maxMOQ: maxMOQ !== undefined && maxMOQ !== null ? maxMOQ : 300,
      maxLeadTime: maxLeadTime !== undefined && maxLeadTime !== null ? maxLeadTime : 6,
      supplierCerts: supplierCerts || "Basic (ISO/BSCI)",
      
      // Other
      numberOfProducts: numberOfProducts !== undefined && numberOfProducts !== null ? numberOfProducts : 3,
      riskTolerance: riskTolerance || "Low",
      outputDetail: outputDetail || "Detailed"
    };

    console.log("\n🔧 === APPLIED ANALYSIS PARAMETERS ===");
    console.log("Category:", analysisParams.category);
    console.log("Region:", analysisParams.region);
    console.log("Max COGS: $" + analysisParams.maxCogs);
    console.log("Min Retail Price: $" + analysisParams.minRetailPrice);
    console.log("Min Margin:", analysisParams.minMargin + "%");
    console.log("Number of Products:", analysisParams.numberOfProducts);
    console.log("Risk Tolerance:", analysisParams.riskTolerance);
    console.log("Output Detail:", analysisParams.outputDetail);

    console.log("\n📊 Step 1: Generating Grok analysis...");
    const grokResult = await analyzeWithGrok(
      category.name, 
      analysisParams.region, 
      productName
    );

    if (!grokResult.success) {
      console.error("❌ Grok analysis failed");
      return res.status(500).json({
        success: false,
        message: "Failed to generate analysis",
      });
    }

    console.log("✅ Grok analysis completed");

    // Step 2: Generate 3D model with Meshy
    console.log("\n🎨 Step 2: Generating 3D model...");
    const model3DResult = await generate3DModelWithMeshy(
      grokResult.analysis,
      artStyle
    );

    console.log("✅ 3D model task initiated");
    console.log("🆔 Task ID:", model3DResult.taskId || model3DResult.id);

    // Step 3: Generate detailed insights with all parameters
    console.log("\n📝 Step 3: Generating detailed insights...");
    const inputAnalysis = grokResult.analysis;

    const detailInsights = await generateDetailedInsight(
      inputAnalysis, 
      analysisParams
    );

    console.log("✅ Detailed insights generated");
    console.log("📏 Insight length:", detailInsights.insight?.length || 0, "characters");
    console.log("🤖 Model used:", detailInsights.model);

    console.log("\n🎉 === ANALYSIS COMPLETE ===");

    // Return response
    return res.status(200).json({
      success: true,
      message: "Analysis completed. 3D model generation started.",
      insights: detailInsights.insight,
      appliedConstraints: analysisParams,
      model3D: model3DResult,
      metadata: {
        category: category.name,
        region: analysisParams.region,
        productName: productName || category.name,
        timestamp: new Date().toISOString(),
        grokModel: grokResult.model,
        parameters: {
          maxCogs: analysisParams.maxCogs,
          minRetailPrice: analysisParams.minRetailPrice,
          minMargin: analysisParams.minMargin,
          numberOfProducts: analysisParams.numberOfProducts,
          outputDetail: analysisParams.outputDetail,
        }
      },
    });

  } catch (error) {
    console.error("\n❌ === ANALYSIS ERROR ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Internal server error during analysis",
      error: error.message,
    });
  }
}

export async function analyzeInsightsOnly(req, res) {
  try {
    const { 
      categoryId, 
      productName, 
      refinementContext,  // ← NEW: Optional refinement context
      artStyle = "realistic",
      
      // Product & Niche
      productType,
      sizeConstraint,
      gatedPreference,
      seasonality,
      
      // Financials
      maxCogs,
      minRetailPrice,
      minMargin,
      maxStartup,
      maxCAC,
      minCLV,
      
      // Market & Demand
      region,
      minMarketSize,
      minGrowth,
      minSearchVolume,
      minVirality,
      platformFocus,
      
      // Competition
      maxCompetition,
      maxAmazonListings,
      maxDTCBrands,
      
      // Supply Chain
      maxMOQ,
      maxLeadTime,
      supplierCerts,
      
      // Other
      numberOfProducts,
      riskTolerance,
      outputDetail
    } = req.body;

    console.log("\n🎯 === INSIGHTS-ONLY ANALYSIS REQUEST ===");
    console.log("📦 Category ID:", categoryId);
    console.log("🌍 Region:", region || "North America (default)");
    console.log("💬 Refinement Context:", refinementContext ? "Provided" : "None");

    // Validate category exists
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Build analysis parameters with defaults
    const analysisParams = {
      category: category.name,
      
      // Product & Niche
      productType: productType || "Non-Electronic Only",
      sizeConstraint: sizeConstraint || "Small (under 12×9×6 inches, <2 lbs)",
      gatedPreference: gatedPreference || "Avoid All Gated",
      seasonality: seasonality || "Evergreen",
      
      // Financials
      maxCogs: maxCogs !== undefined && maxCogs !== null ? maxCogs : 7,
      minRetailPrice: minRetailPrice !== undefined && minRetailPrice !== null ? minRetailPrice : 30,
      minMargin: minMargin !== undefined && minMargin !== null ? minMargin : 70,
      maxStartup: maxStartup !== undefined && maxStartup !== null ? maxStartup : 15000,
      maxCAC: maxCAC !== undefined && maxCAC !== null ? maxCAC : 8,
      minCLV: minCLV !== undefined && minCLV !== null ? minCLV : 100,
      
      // Market & Demand
      region: region || "North America",
      minMarketSize: minMarketSize !== undefined && minMarketSize !== null ? minMarketSize : 200,
      minGrowth: minGrowth !== undefined && minGrowth !== null ? minGrowth : 20,
      minSearchVolume: minSearchVolume !== undefined && minSearchVolume !== null ? minSearchVolume : 15000,
      minVirality: minVirality !== undefined && minVirality !== null ? minVirality : 750000,
      platformFocus: platformFocus || "All Platforms",
      
      // Competition
      maxCompetition: maxCompetition !== undefined && maxCompetition !== null ? maxCompetition : 35,
      maxAmazonListings: maxAmazonListings !== undefined && maxAmazonListings !== null ? maxAmazonListings : 75,
      maxDTCBrands: maxDTCBrands !== undefined && maxDTCBrands !== null ? maxDTCBrands : 50,
      
      // Supply Chain
      maxMOQ: maxMOQ !== undefined && maxMOQ !== null ? maxMOQ : 300,
      maxLeadTime: maxLeadTime !== undefined && maxLeadTime !== null ? maxLeadTime : 6,
      supplierCerts: supplierCerts || "Basic (ISO/BSCI)",
      
      // Other
      numberOfProducts: numberOfProducts !== undefined && numberOfProducts !== null ? numberOfProducts : 3,
      riskTolerance: riskTolerance || "Low",
      outputDetail: outputDetail || "Detailed"
    };

    console.log("\n🔧 === APPLIED PARAMETERS ===");
    console.log("Category:", analysisParams.category);
    console.log("Region:", analysisParams.region);
    console.log("Max COGS: $" + analysisParams.maxCogs);
    console.log("Number of Products:", analysisParams.numberOfProducts);

    // Step 1: Get AI analysis from Grok (with optional refinement context)
    console.log("\n📊 Step 1: Generating Grok analysis...");
    const grokResult = await analyzeWithGrok(
      category.name, 
      analysisParams.region, 
      productName,
      refinementContext  // ← PASS REFINEMENT CONTEXT (can be undefined/null)
    );

    if (!grokResult.success) {
      console.error("❌ Grok analysis failed");
      return res.status(500).json({
        success: false,
        message: "Failed to generate analysis",
      });
    }

    console.log("✅ Grok analysis completed");
    console.log("📝 Mesh prompt length:", grokResult.analysis?.length || 0);

    // Step 2: Generate detailed insights (with optional refinement context)
    console.log("\n📝 Step 2: Generating detailed insights...");
    const detailInsights = await generateDetailedInsight(
      grokResult.analysis, 
      analysisParams,
      refinementContext  // ← PASS REFINEMENT CONTEXT (can be undefined/null)
    );

    console.log("✅ Detailed insights generated");
    console.log("📏 Insight length:", detailInsights.insight?.length || 0, "characters");

    console.log("\n🎉 === INSIGHTS GENERATION COMPLETE ===");

    // Return response WITHOUT 3D model generation
    return res.status(200).json({
      success: true,
      message: "Insights generated successfully. You can now optionally generate a 3D model.",
      insights: detailInsights.insight,
      meshPrompt: grokResult.analysis,           // Save for potential 3D generation
      productDescription: grokResult.description,
      appliedConstraints: analysisParams,
      metadata: {
        category: category.name,
        region: analysisParams.region,
        productName: productName || category.name,
        refinementContext: refinementContext || null,  // Include in metadata
        timestamp: new Date().toISOString(),
        grokModel: grokResult.model,
        parameters: {
          maxCogs: analysisParams.maxCogs,
          minRetailPrice: analysisParams.minRetailPrice,
          minMargin: analysisParams.minMargin,
          numberOfProducts: analysisParams.numberOfProducts,
          outputDetail: analysisParams.outputDetail,
        }
      },
    });

  } catch (error) {
    console.error("\n❌ === INSIGHTS GENERATION ERROR ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Internal server error during insights generation",
      error: error.message,
    });
  }
}

export async function generate3DFromPrompt(req, res) {
  try {
    const { meshPrompt, artStyle = "realistic" } = req.body;

    console.log("\n🎨 === STANDALONE 3D GENERATION REQUEST ===");
    console.log("📝 Mesh Prompt Length:", meshPrompt?.length || 0);
    console.log("🎭 Art Style:", artStyle);

    // Validation
    if (!meshPrompt || typeof meshPrompt !== 'string' || meshPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "meshPrompt is required and must be a non-empty string",
      });
    }

    if (meshPrompt.length > 500) {
      return res.status(400).json({
        success: false,
        message: "meshPrompt is too long (max 500 characters)",
      });
    }

    // Generate 3D model
    console.log("\n🎨 Initiating 3D model generation...");
    const model3DResult = await generate3DModelWithMeshy(meshPrompt, artStyle);

    if (!model3DResult.success) {
      console.error("❌ 3D generation failed:", model3DResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to initiate 3D model generation",
        error: model3DResult.error,
      });
    }

    console.log("✅ 3D model task initiated successfully");
    console.log("🆔 Task ID:", model3DResult.id || model3DResult.previewTaskId);

    return res.status(200).json({
      success: true,
      message: "3D model generation started. Use the task ID to poll for status.",
      model3D: model3DResult,
      polling: {
        endpoint: `/api/v1/analysis/3d-status/${model3DResult.id || model3DResult.previewTaskId}`,
        intervalSeconds: 15,
        maxAttempts: 60
      }
    });

  } catch (error) {
    console.error("\n❌ === 3D GENERATION ERROR ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Internal server error during 3D generation",
      error: error.message,
    });
  }
}