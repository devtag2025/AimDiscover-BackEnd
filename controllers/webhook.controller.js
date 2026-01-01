import { stripeService } from "../services/index.js";
import { ApiResponse } from "../utils/index.js";
import { env } from "../config/env.config.js";
import db from "../db/connect.js";
import { meshyTasks } from "../schema/meshy-tasks.js";
import { eq, or } from "drizzle-orm";
import axios from "axios";
import fetch from "node-fetch";
import webhookService from "../services/webhook.service.js";
import crypto from "crypto";

const MESHY_WEBHOOK_SECRET = env.MESHY_WEBHOOK_SECRET;
console.log("----- MESHY_WEBHOOK_SECRET", !!MESHY_WEBHOOK_SECRET);

console.log("Client URL", !!env.FRONTEND_URL, env.FRONTEND_URL);
console.log("FRONTEND URL", !!env.CLIENT_URL, env.CLIENT_URL);

// ✅ Task status constants
const TASK_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  REFINE_PENDING: "REFINE_PENDING",
  REFINE_IN_PROGRESS: "REFINE_IN_PROGRESS",
  REFINE_FAILED: "REFINE_FAILED",
};

export const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];
    const rawBody = req.body;

    console.log("Raw body of Stripe", rawBody, !!rawBody);
    console.log("This is the signature of Stripe", signature, !!signature);
    
    if (!signature) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Missing Stripe signature"));
    }

    const result = await stripeService.processWebhook(rawBody, signature);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Webhook processed successfully"));
  } catch (error) {
    if (error.message.includes("signature")) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "Webhook signature verification failed")
        );
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { processed: false },
          "Webhook received but processing failed"
        )
      );
  }
};

export const handleMeshyWebhook = async (req, res) => {
  try {
    let payload;

    if (Buffer.isBuffer(req.body)) {
      const rawBody = req.body.toString();
      payload = JSON.parse(rawBody);
    } else {
      payload = req.body;
    }

    // ✅ Signature verification
    const signature = req.headers["x-meshy-signature"];
    const secret = process.env.MESHY_WEBHOOK_SECRET;

    if (secret && signature && Buffer.isBuffer(req.body)) {
      const computedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (computedSignature !== signature) {
        console.error("❌ Invalid webhook signature");
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    const { id, mode, status, progress } = payload;

    console.log(`\n📋 Webhook: mode=${mode}, status=${status}, id=${id}`);

    // ===================================
    // HANDLE PREVIEW TASK
    // ===================================
    if (mode === "preview") {
      console.log("\n🟨 === PREVIEW TASK UPDATE ===");

      const existingTask = await webhookService.taskById(id);

      if (!existingTask) {
        console.warn("⚠️ Preview task not found in database:", id);
        return res.status(404).json({
          message: "Task not found",
          taskId: id,
        });
      }

      const task = existingTask[0];

      // ✅ Update preview progress
      await webhookService.updateTaskById({
        id,
        status,
        progress,
        payload,
      });

      console.log(`✅ Database updated for preview task: ${id}`);

      // ===================================
      // ✅ PREVIEW SUCCEEDED - ASYNC HANDLING
      // ===================================
      if (status === "SUCCEEDED") {
        console.log("\n🎉 PREVIEW SUCCEEDED!");

        // ✅ SAFETY CHECK 1: Prevent duplicate refine tasks
        if (task.refineTaskId) {
          console.log("⚠️ Refine already started for this task, skipping");
          return res.status(200).json({
            message: "Preview completed, refine already in progress",
            previewTaskId: id,
            refineTaskId: task.refineTaskId,
            status: "SUCCEEDED",
          });
        }

        // ✅ SAFETY CHECK 2: Check if already queued
        if (
          task.status === TASK_STATUS.REFINE_PENDING ||
          task.status === TASK_STATUS.REFINE_IN_PROGRESS
        ) {
          console.log("⚠️ Refine already queued/in progress, skipping");
          return res.status(200).json({
            message: "Preview completed, refine in progress",
            previewTaskId: id,
            status: "SUCCEEDED",
          });
        }

        try {
          // ✅ STEP 1: Mark as refine pending BEFORE responding
          await webhookService.updateTaskById({
            id,
            status: TASK_STATUS.REFINE_PENDING,
            progress: 100,
            payload,
          });

          console.log("✅ Status updated to REFINE_PENDING");

          // ✅ STEP 2: Respond immediately to webhook
          res.status(200).json({
            message: "Preview completed, refine task queued",
            previewTaskId: id,
            status: "SUCCEEDED",
          });

          // ✅ STEP 3: Start refine in background (non-blocking)
          console.log("🔄 Starting refine task in background...");
          
          setImmediate(async () => {
            try {
              await startRefineTask(id, task.prompt, task.artStyle);
            } catch (error) {
              console.error("❌ Background refine task failed:", error.message);
              console.error("Stack:", error.stack);

              // Update database to mark as failed
              try {
                await webhookService.setRefineFailed({
                  previewTaskId: id,
                  error: error.message,
                });
                console.log("✅ Task marked as REFINE_FAILED in database");
              } catch (dbError) {
                console.error(
                  "❌ CRITICAL: Failed to update DB after refine failure:",
                  dbError.message
                );
              }
            }
          });

          return; // Exit handler immediately

        } catch (error) {
          // If database update fails, return error so Meshy retries
          console.error("❌ Failed to update task status:", error.message);
          return res.status(500).json({
            message: "Failed to process webhook",
            error: error.message,
          });
        }
      }

      // ===================================
      // ❌ PREVIEW FAILED
      // ===================================
      if (status === "FAILED") {
        console.error("\n❌ PREVIEW FAILED!");
        console.error("Error:", payload.task_error?.message);

        await webhookService.failPreviewTask({
          id,
          payload,
        });

        return res.status(200).json({
          message: "Preview failed",
          previewTaskId: id,
          status: "FAILED",
          error: payload.task_error?.message,
        });
      }

      // ===================================
      // 🔄 PREVIEW IN PROGRESS
      // ===================================
      return res.status(200).json({
        message: "Preview in progress",
        previewTaskId: id,
        status,
        progress,
      });
    }

    // ===================================
    // HANDLE REFINE TASK
    // ===================================
    if (mode === "refine") {
      console.log("\n🟩 === REFINE TASK UPDATE ===");

      const existingTask = await webhookService.taskByRefineId(id);

      if (!existingTask) {
        console.warn("⚠️ Refine task not found in database:", id);
        return res.status(404).json({
          message: "Refine task not found",
          taskId: id,
        });
      }

      await webhookService.updateRefineTask({
        id,
        status,
        progress,
        payload,
      });

      console.log(`✅ Database updated for refine task: ${id}`);

      // ✅ REFINE SUCCEEDED
      if (status === "SUCCEEDED") {
        console.log("\n🎉 REFINE SUCCEEDED!");
        console.log("✨ 3D model with PBR textures is ready!");
        console.log(
          "📦 Model formats available:",
          Object.keys(payload.model_urls || {})
        );

        const textureTypes = payload.texture_urls?.length
          ? Object.keys(
              payload.texture_urls.reduce(
                (acc, obj) => ({ ...acc, ...obj }),
                {}
              )
            )
          : [];

        return res.status(200).json({
          message: "Refine completed successfully",
          refineTaskId: id,
          status: "SUCCEEDED",
          hasTextures: textureTypes.length > 0,
          textureTypes,
        });
      }

      // ❌ REFINE FAILED
      if (status === "FAILED") {
        console.error("\n❌ REFINE FAILED!");
        console.error("Error:", payload.task_error?.message);

        return res.status(200).json({
          message: "Refine failed",
          refineTaskId: id,
          status: "FAILED",
          error: payload.task_error?.message,
        });
      }

      // 🔄 REFINE IN PROGRESS
      return res.status(200).json({
        message: "Refine in progress",
        refineTaskId: id,
        status,
        progress,
      });
    }

    // Unknown mode
    console.warn("⚠️ Unknown webhook mode:", mode);
    return res.status(400).json({
      message: "Unknown webhook mode",
      mode,
    });

  } catch (error) {
    console.error("\n❌ WEBHOOK ERROR");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      message: "Internal webhook error",
      error: error.message,
    });
  }
};

// ===================================
// ✅ REFACTORED: startRefineTask with Retry Logic
// ===================================
async function startRefineTask(previewTaskId, prompt, artStyle) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `\n🎨 === STARTING REFINE TASK (Attempt ${attempt}/${maxRetries}) ===`
      );
      console.log("🆔 Preview Task ID:", previewTaskId);
      console.log("💬 Prompt:", prompt);
      console.log("🎨 Art Style:", artStyle);

      const refinePayload = {
        mode: "refine",
        preview_task_id: previewTaskId,
        enable_pbr: true,
        ai_model: "meshy-5",
        webhook_url: `${process.env.NGROK_SERVER}/api/v1/webhook/meshy`,
      };

      console.log("📤 Creating Meshy REFINE task...");

      // ✅ FIXED: Axios doesn't have .ok property
      const refineResponse = await axios.post(
        "https://api.meshy.ai/openapi/v2/text-to-3d",
        refinePayload,
        {
          headers: {
            Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30_000, // ✅ Reduced to 30 seconds
        }
      );

      // ✅ Extract refine task ID directly
      const refineTaskId = refineResponse.data.result;

      if (!refineTaskId) {
        throw new Error("No refine task ID in response");
      }

      console.log("✅ Meshy REFINE task created successfully!");
      console.log("🆔 Refine Task ID:", refineTaskId);
      console.log("🔔 Webhook will notify when refine completes");

      // Update database with refine task ID
      await webhookService.setRefineStarted({
        previewTaskId,
        refineTaskId,
      });

      console.log("✅ Database updated with refine task ID");

      return; // ✅ Success! Exit function

    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      // ✅ Log API error details
      if (error.response) {
        console.error("API Response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      // ✅ Exponential backoff before retry
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // ✅ All retries failed
  console.error(
    `❌ All ${maxRetries} attempts failed. Last error:`,
    lastError.message
  );

  // Update database to mark as failed
  await webhookService.setRefineFailed({
    previewTaskId,
    error: `Failed after ${maxRetries} attempts: ${lastError.message}`,
  });

  throw lastError; // Re-throw for outer catch block
}

// ===================================
// Get Task Status
// ===================================
export const getMeshyTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskData = await webhookService.getTaskById(taskId);

    if (!taskData) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      task: {
        id: taskData.id,
        previewTaskId: taskData.previewTaskId,
        refineTaskId: taskData.refineTaskId,
        status: taskData.status,
        progress: taskData.progress,
        stage: taskData.stage,
        prompt: taskData.prompt,
        artStyle: taskData.artStyle,
        modelUrls: taskData.modelUrls,
        textureUrls: taskData.textureUrls,
        thumbnailUrl: taskData.thumbnailUrl,
        videoUrl: taskData.videoUrl,
        taskError: taskData.taskError,
        createdAt: taskData.createdAt,
        finishedAt: taskData.finishedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching task status:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ===================================
// Proxy Meshy Model
// ===================================
export const proxyMeshyModel = async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log("\n🔍 === PROXY REQUEST ===", taskId);

    const task = await webhookService.getRefineTaskByRefineId(taskId);

    if (!task) {
      console.error("❌ Task not found");
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("📊 Task Status:", task.status);

    const modelUrls = webhookService.parseModelUrls(task.modelUrls);

    if (!task.textureUrls || Object.keys(task.textureUrls).length === 0) {
      console.log("⚠️ Refined model not ready yet");
      return res.status(202).json({
        message: "Model is being refined",
        status: task.status,
        progress: task.progress,
        refineTaskId: task.refineTaskId,
      });
    }

    if (!modelUrls) {
      console.error("❌ Model URLs missing or invalid");
      return res.status(400).json({ message: "Model URLs missing or invalid" });
    }

    const modelUrl = modelUrls.glb || modelUrls.usdz || modelUrls.fbx;

    if (!modelUrl) {
      console.error("❌ No model format available");
      return res.status(404).json({ message: "No model format available" });
    }

    console.log("🎨 Serving refined model:", modelUrl);

    const response = await axios.get(modelUrl, {
      responseType: "arraybuffer",
      timeout: 300_000,
      headers: { "User-Agent": "AimDiscover-Proxy/1.0" },
    });

    res.setHeader("Content-Type", "model/gltf-binary");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000");

    console.log("✅ Model served successfully");
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(500).json({
      message: "Failed to proxy model",
      error: error.message,
    });
  }
};