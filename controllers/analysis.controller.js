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
    const { categoryId, region, productName, artStyle = "realistic", cogs } = req.body;

    console.log("\n🎯 === NEW ANALYSIS REQUEST ===");
    console.log("📦 Category ID:", categoryId);
    console.log("🌍 Region:", region);
    console.log("🏷️ Product Name:", productName || "Not specified");
    console.log("🎨 Art Style:", artStyle);

    if (!categoryId || !region ||!cogs) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Category ID and region are required",
      });
    }

    // Get category details
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

    // Step 1: Get AI analysis from Grok
    const grokResult = await analyzeWithGrok(category.name, region, productName);

    if (!grokResult.success) {
      console.error("❌ Grok analysis failed");
      return res.status(500).json({
        success: false,
        message: "Failed to generate analysis",
      });
    }

    //  Step 2: Generate 3D model with Meshy
    const model3DResult = await generate3DModelWithMeshy(
      grokResult.analysis,
      artStyle
    );

    console.log("\n✅ === ANALYSIS COMPLETE ===");
    console.log("📊 Grok analysis:", grokResult.success ? "✓" : "✗");
    console.log("🎨 3D model task:", model3DResult.success ? "✓" : "✗");
    console.log("🆔 Task ID:", model3DResult.taskId);

    // Our 3rd step i guess which will take the grok shortened text and create some detailed analysis for the user

    const inputAnalysis = grokResult.analysis

const DetailInsights = await generateDetailedInsight(inputAnalysis,region,cogs)


   

    // Return response immediately
    return res.status(200).json({
      success: true,
      message: "Analysis completed. 3D model generation started.",
      insights: DetailInsights.insight,
      // model3D: model3DResult,
      metadata: {
        category: category.name,
        region,
        productName: productName || category.name,
        timestamp: new Date().toISOString(),
        grokModel: grokResult.model,
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

