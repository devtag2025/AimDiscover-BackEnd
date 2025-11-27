import { stripeService } from '../services/index.js';
import { ApiResponse } from '../utils/index.js';
import { env } from '../config/env.config.js';
import db from '../db/connect.js';
import { meshyTasks } from '../schema/meshy-tasks.js';
import { eq ,or } from 'drizzle-orm';
import axios from 'axios';
import { createId } from '@paralleldrive/cuid2';
import fetch from 'node-fetch';
// import { put } from '@vercel/blob'; // or use AWS S3, Cloudinary, etc.

// ===== STRIPE WEBHOOKS =====
const MESHY_WEBHOOK_SECRET = env.MESHY_WEBHOOK_SECRET;
console.log("----- MESHY_WEBHOOK_SECRET" , !!MESHY_WEBHOOK_SECRET)

console.log("Client URL",!!env.FRONTEND_URL,env.FRONTEND_URL);
console.log("FRONTEND URL", !!env.CLIENT_URL,env.CLIENT_URL);
export const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.body;

    if (!signature) {
      return res.status(400).json(
        new ApiResponse(400, null, "Missing Stripe signature")
      );
    }

    const result = await stripeService.processWebhook(rawBody, signature);
    
    res.status(200).json(
      new ApiResponse(200, result, "Webhook processed successfully")
    );

  } catch (error) {
    // Handle signature verification errors
    if (error.message.includes('signature')) {
      return res.status(400).json(
        new ApiResponse(400, null, "Webhook signature verification failed")
      );
    }
    res.status(200).json(
      new ApiResponse(200, { processed: false }, "Webhook received but processing failed")
    );
  }
};

import crypto from "crypto";




// export const handleMeshyWebhook = async (req, res) => {
//   try {
//     let payload;

//     // Handle both raw Buffer and parsed JSON
//     if (Buffer.isBuffer(req.body)) {
//       const rawBody = req.body.toString();
//       payload = JSON.parse(rawBody);
//     } else {
//       payload = req.body;
//     }

//     const signature = req.headers["x-meshy-signature"];
//     const secret = process.env.MESHY_WEBHOOK_SECRET;

//     // Signature verification (if secret provided)
//     if (secret && signature && Buffer.isBuffer(req.body)) {
//       const computedSignature = crypto
//         .createHmac("sha256", secret)
//         .update(req.body)
//         .digest("hex");

//       if (computedSignature !== signature) {
//         console.error("❌ Invalid webhook signature");
//         return res.status(400).json({ message: "Invalid signature" });
//       }
//     }

//     console.log("✅ Meshy Webhook Received:");
//     console.log("Status:", payload.status);
//     console.log("Task ID:", payload.id);
//     console.log("Progress:", payload.progress);

//     // Prepare data to save in DB
//     const updateData = {
//       status: payload.status || "PENDING",
//       progress: payload.progress || 0,
//       prompt: payload.prompt || "",
//       artStyle: payload.art_style || "",
//       modelUrls: payload.model_urls ? JSON.stringify(payload.model_urls) : null,
//       thumbnailUrl: payload.thumbnail_url || null,
//       videoUrl: payload.video_url || null,
//       finishedAt: payload.status === "SUCCEEDED" || payload.status === "FAILED" ? new Date() : null,
//       taskError: payload.task_error || null,
//     };

//     // Update existing task or insert if not found
//     const [updatedTask] = await db
//       .update(meshyTasks)
//       .set(updateData)
//       .where(eq(meshyTasks.taskId, payload.id))
//       .returning();

//     if (!updatedTask) {
//       console.log("⚠️ Task not found in DB, inserting a new one...");
//       const [newTask] = await db.insert(meshyTasks).values({
//         id: payload.id, // you can use createId() if you want a unique DB ID separate from Meshy taskId
//         taskId: payload.id,
//         ...updateData,
//         createdAt: new Date(),
//       }).returning();

//       console.log("💾 New task inserted:", newTask.taskId);
//     } else {
//       console.log("💾 Existing task updated:", updatedTask.taskId);
//     }

//     // Optional: log model URLs if succeeded
//     if (payload.status === "SUCCEEDED" && payload.model_urls) {
//       console.log("🧱 Model generation succeeded!");
//       console.log("GLB URL:", payload.model_urls.glb);
//       console.log("FBX URL:", payload.model_urls.fbx);
//       console.log("USDZ URL:", payload.model_urls.usdz);
//       console.log("OBJ URL:", payload.model_urls.obj);
//       console.log("Thumbnail URL:", payload.thumbnail_url);
//       console.log("Video URL:", payload.video_url);
//     }

//     res.status(200).json({ message: "Webhook processed successfully" });
//   } catch (error) {
//     console.error("❌ Error in webhook:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };



// export const handleMeshyWebhook = async (req, res) => {
//   try {
//     let payload;

//     // Handle both raw Buffer and parsed JSON
//     if (Buffer.isBuffer(req.body)) {
//       const rawBody = req.body.toString();
//       payload = JSON.parse(rawBody);
//     } else {
//       payload = req.body;
//     }

//     const signature = req.headers["x-meshy-signature"];
//     const secret = process.env.MESHY_WEBHOOK_SECRET;

//     // Signature verification (if secret provided)
//     if (secret && signature && Buffer.isBuffer(req.body)) {
//       const computedSignature = crypto
//         .createHmac("sha256", secret)
//         .update(req.body)
//         .digest("hex");

//       if (computedSignature !== signature) {
//         console.error("❌ Invalid webhook signature");
//         return res.status(400).json({ message: "Invalid signature" });
//       }
//     }

//     console.log("✅ Meshy Webhook Received:");
//     console.log("Status:", payload.status);
//     console.log("Task ID:", payload.id);
//     console.log("Progress:", payload.progress);

//     // 🔥 Download and store files when succeeded
//     let permanentUrls = null;
//     if (payload.status === "SUCCEEDED" && payload.model_urls) {
//       console.log("🧱 Model generation succeeded! Downloading files...");
      
//       try {
//         permanentUrls = await downloadAndStoreFiles(payload);
//         console.log("✅ Files stored permanently:", permanentUrls);
//       } catch (downloadError) {
//         console.error("❌ Error downloading files:", downloadError);
//         // Continue anyway, we'll store temporary URLs as fallback
//       }
//     }

//     // Prepare data to save in DB
//     const updateData = {
//       status: payload.status || "PENDING",
//       progress: payload.progress || 0,
//       prompt: payload.prompt || "",
//       artStyle: payload.art_style || "",
//       // Store permanent URLs if available, otherwise temporary ones
//       modelUrls: permanentUrls 
//         ? JSON.stringify(permanentUrls) 
//         : (payload.model_urls ? JSON.stringify(payload.model_urls) : null),
//       thumbnailUrl: permanentUrls?.thumbnail || payload.thumbnail_url || null,
//       videoUrl: permanentUrls?.video || payload.video_url || null,
//       finishedAt: payload.status === "SUCCEEDED" || payload.status === "FAILED" ? new Date() : null,
//       taskError: payload.task_error || null,
//     };

//     // Update existing task or insert if not found
//     const [updatedTask] = await db
//       .update(meshyTasks)
//       .set(updateData)
//       .where(eq(meshyTasks.taskId, payload.id))
//       .returning();

//     if (!updatedTask) {
//       console.log("⚠️ Task not found in DB, inserting a new one...");
//       const [newTask] = await db.insert(meshyTasks).values({
//         id: payload.id,
//         taskId: payload.id,
//         ...updateData,
//         createdAt: new Date(),
//       }).returning();

//       console.log("💾 New task inserted:", newTask.taskId);
//     } else {
//       console.log("💾 Existing task updated:", updatedTask.taskId);
//     }

//     res.status(200).json({ message: "Webhook processed successfully" });
//   } catch (error) {
//     console.error("❌ Error in webhook:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


// export const handleMeshyWebhook = async (req, res) => {
//   try {
//     let payload;

//     if (Buffer.isBuffer(req.body)) {
//       const rawBody = req.body.toString();
//       payload = JSON.parse(rawBody);
//     } else {
//       payload = req.body;
//     }

//     const signature = req.headers["x-meshy-signature"];
//     const secret = process.env.MESHY_WEBHOOK_SECRET;

//     if (secret && signature && Buffer.isBuffer(req.body)) {
//       const computedSignature = crypto
//         .createHmac("sha256", secret)
//         .update(req.body)
//         .digest("hex");

//       if (computedSignature !== signature) {
//         console.error("❌ Invalid webhook signature");
//         return res.status(400).json({ message: "Invalid signature" });
//       }
//     }

//     console.log("✅ Meshy Webhook Received:");
//     console.log("Status:", payload.status);
//     console.log("Task ID:", payload.id);

//     let permanentUrls = null;
//     if (payload.status === "SUCCEEDED" && payload.model_urls) {
//       console.log("🧱 Downloading files...");
      
//       try {
//         permanentUrls = await downloadAndStoreFiles(payload);
//         console.log("✅ Files stored:", permanentUrls);
//       } catch (downloadError) {
//         console.error("❌ Download error:", downloadError);
//       }
//     }

//     // ✅ CRITICAL FIX: Store as plain object (Drizzle handles JSONB serialization)
//     const updateData = {
//       status: payload.status || "PENDING",
//       progress: payload.progress || 0,
//       prompt: payload.prompt || "",
//       artStyle: payload.art_style || "",
//       // ✅ NO JSON.stringify! Just the plain object
//       modelUrls: permanentUrls || payload.model_urls || null,
//       thumbnailUrl: permanentUrls?.thumbnail || payload.thumbnail_url || null,
//       videoUrl: permanentUrls?.video || payload.video_url || null,
//       finishedAt: payload.status === "SUCCEEDED" || payload.status === "FAILED" ? new Date() : null,
//       taskError: payload.task_error || null,
//     };

//     console.log("📝 Saving modelUrls:", updateData.modelUrls);

//     const [updatedTask] = await db
//       .update(meshyTasks)
//       .set(updateData)
//       .where(eq(meshyTasks.taskId, payload.id))
//       .returning();

//     if (!updatedTask) {
//       console.log("⚠️ Task not found, inserting...");
//       const [newTask] = await db.insert(meshyTasks).values({
//         id: payload.id,
//         taskId: payload.id,
//         ...updateData,
//         createdAt: new Date(),
//       }).returning();

//       console.log("💾 New task inserted:", newTask.taskId);
//     } else {
//       console.log("💾 Task updated:", updatedTask.taskId);
//     }

//     res.status(200).json({ message: "Webhook processed successfully" });
//   } catch (error) {
//     console.error("❌ Webhook error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };












// export const proxyMeshyModel = async (req, res) => {
//   try {
//     const { taskId } = req.params;

//     // Query DB
//     const [task] = await db
//       .select()
//       .from(meshyTasks)
//       .where(eq(meshyTasks.taskId, taskId))
//       .limit(1);

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     // Safe JSON parsing - FIX: use modelUrls instead of model_urls
//     let modelUrls = task.modelUrls; // ✅ Changed from task.model_urls
//     if (typeof modelUrls === "string") {
//       try {
//         modelUrls = JSON.parse(modelUrls);
//       } catch {
//         return res.status(500).json({ message: "Invalid model URLs" });
//       }
//     }

//     if (!modelUrls) {
//       return res.status(400).json({ message: "Model URLs missing" });
//     }

//     const modelUrl = modelUrls.glb || modelUrls.usdz;
//     if (!modelUrl) {
//       return res.status(404).json({ message: "No GLB or USDZ available" });
//     }

//     // Fetch from Meshy
//     const response = await axios.get(modelUrl, {
//       responseType: "arraybuffer",
//       timeout: 300000,
//     });

//     // Send with proper headers
//     res.setHeader("Content-Type", "model/gltf-binary");
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

//     res.send(Buffer.from(response.data));

//   } catch (error) {
//     console.error("Proxy error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// 🔥 Helper function to download and store files permanently
// async function downloadAndStoreFiles(payload) {
//   const apiKey = process.env.MESHY_API_KEY;
//   const files = {};

//   // Download GLB file
//   if (payload.model_urls?.glb) {
//     try {
//       const glbResponse = await fetch(payload.model_urls.glb, {
//         headers: {
//           'Authorization': `Bearer ${apiKey}`,
//         },
//       });
      
//       if (glbResponse.ok) {
//         const glbBlob = await glbResponse.blob();
//         const glbBuffer = Buffer.from(await glbBlob.arrayBuffer());
        
//         // Upload to your storage (Vercel Blob example)
//         const { url } = await put(`models/${payload.id}.glb`, glbBuffer, {
//           access: 'public',
//           contentType: 'model/gltf-binary',
//         });
        
//         files.glb = url;
//         console.log("✅ GLB uploaded:", url);
//       }
//     } catch (err) {
//       console.error("❌ Error downloading GLB:", err);
//     }
//   }

//   // Download FBX file
//   if (payload.model_urls?.fbx) {
//     try {
//       const fbxResponse = await fetch(payload.model_urls.fbx, {
//         headers: {
//           'Authorization': `Bearer ${apiKey}`,
//         },
//       });
      
//       if (fbxResponse.ok) {
//         const fbxBlob = await fbxResponse.blob();
//         const fbxBuffer = Buffer.from(await fbxBlob.arrayBuffer());
        
//         const { url } = await put(`models/${payload.id}.fbx`, fbxBuffer, {
//           access: 'public',
//           contentType: 'application/octet-stream',
//         });
        
//         files.fbx = url;
//         console.log("✅ FBX uploaded:", url);
//       }
//     } catch (err) {
//       console.error("❌ Error downloading FBX:", err);
//     }
//   }

//   // Download thumbnail
//   if (payload.thumbnail_url) {
//     try {
//       const thumbResponse = await fetch(payload.thumbnail_url, {
//         headers: {
//           'Authorization': `Bearer ${apiKey}`,
//         },
//       });
      
//       if (thumbResponse.ok) {
//         const thumbBlob = await thumbResponse.blob();
//         const thumbBuffer = Buffer.from(await thumbBlob.arrayBuffer());
        
//         const { url } = await put(`thumbnails/${payload.id}.png`, thumbBuffer, {
//           access: 'public',
//           contentType: 'image/png',
//         });
        
//         files.thumbnail = url;
//         console.log("✅ Thumbnail uploaded:", url);
//       }
//     } catch (err) {
//       console.error("❌ Error downloading thumbnail:", err);
//     }
//   }

//   // Download video (if exists)
//   if (payload.video_url) {
//     try {
//       const videoResponse = await fetch(payload.video_url, {
//         headers: {
//           'Authorization': `Bearer ${apiKey}`,
//         },
//       });
      
//       if (videoResponse.ok) {
//         const videoBlob = await videoResponse.blob();
//         const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());
        
//         const { url } = await put(`videos/${payload.id}.mp4`, videoBuffer, {
//           access: 'public',
//           contentType: 'video/mp4',
//         });
        
//         files.video = url;
//         console.log("✅ Video uploaded:", url);
//       }
//     } catch (err) {
//       console.error("❌ Error downloading video:", err);
//     }
//   }

//   return files;
// }

//Proxy controller to get the url from the db and show it to the front


// export const proxyMeshyModel = async (req, res) => {
//   try {
//     const { taskId } = req.params;

//     console.log(`🔍 Looking up task: ${taskId}`);

//     const [task] = await db
//       .select()
//       .from(meshyTasks)
//       .where(eq(meshyTasks.taskId, taskId))
//       .limit(1);

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     console.log(`📊 Raw modelUrls type:`, typeof task.modelUrls);
//     console.log(`📊 Raw modelUrls value:`, task.modelUrls);

//     let modelUrls = task.modelUrls;

//     // ✅ Handle double-stringified data (for existing records)
//     if (typeof modelUrls === "string") {
//       console.log(`⚠️ modelUrls is a string, parsing...`);
//       try {
//         modelUrls = JSON.parse(modelUrls);
//         console.log(`✅ First parse successful:`, typeof modelUrls);
        
//         // Check if it's STILL a string (double-stringified)
//         if (typeof modelUrls === "string") {
//           console.log(`⚠️ Still a string, parsing again...`);
//           modelUrls = JSON.parse(modelUrls);
//         }
//       } catch (parseError) {
//         console.error(`❌ Parse error:`, parseError.message);
//         return res.status(500).json({ 
//           message: "Invalid model data",
//           error: parseError.message
//         });
//       }
//     }

//     if (!modelUrls || typeof modelUrls !== "object") {
//       return res.status(400).json({ 
//         message: "Model URLs missing or invalid",
//         type: typeof modelUrls
//       });
//     }

//     console.log(`✅ Final modelUrls:`, modelUrls);

//     const modelUrl = modelUrls.glb || modelUrls.usdz || modelUrls.fbx;
    
//     if (!modelUrl) {
//       return res.status(404).json({ 
//         message: "No model file available",
//         availableFormats: Object.keys(modelUrls)
//       });
//     }

//     console.log(`📦 Fetching from: ${modelUrl.substring(0, 80)}...`);

//     const response = await axios.get(modelUrl, {
//       responseType: "arraybuffer",
//       timeout: 30000,
//       headers: {
//         ...(modelUrl.includes('meshy.ai') && {
//           'Authorization': `Bearer ${process.env.MESHY_API_KEY}`
//         })
//       }
//     });

//     console.log(`✅ Fetched ${response.data.length} bytes`);

//     res.setHeader("Content-Type", "model/gltf-binary");
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
//     res.setHeader("Cache-Control", "public, max-age=31536000");

//     res.send(Buffer.from(response.data));

//   } catch (error) {
//     console.error("❌ Proxy error:", error.message);
//     console.error("Stack:", error.stack);
    
//     res.status(500).json({ 
//       message: "Error fetching model",
//       error: error.message,
//       taskId: req.params.taskId
//     });
//   }
// };

export const handleMeshyWebhook = async (req, res) => {
  try {
    let payload;

    // Handle raw or parsed JSON body
    if (Buffer.isBuffer(req.body)) {
      const rawBody = req.body.toString();
      payload = JSON.parse(rawBody);
    } else {
      payload = req.body;
    }

    console.log("\n=== 🟦 MESHY WEBHOOK RECEIVED ===");
    console.log(JSON.stringify(payload, null, 2));

    // Verify signature (optional but recommended)
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

    console.log(`\n📋 Webhook Details:`);
    console.log(`   Task ID: ${id}`);
    console.log(`   Mode: ${mode}`);
    console.log(`   Status: ${status}`);
    console.log(`   Progress: ${progress}%`);

    // -----------------------------------
    // HANDLE PREVIEW TASK
    // -----------------------------------
    if (mode === "preview") {
      console.log("\n🟨 === PREVIEW TASK UPDATE ===");

      // Find task in database
      const existingTask = await db
        .select()
        .from(meshyTasks)
        .where(eq(meshyTasks.previewTaskId, id))
        .limit(1);

      if (!existingTask.length) {
        console.warn("⚠️ Preview task not found in database:", id);
        return res.status(404).json({ 
          message: "Task not found",
          taskId: id 
        });
      }

      const task = existingTask[0];

      // Update preview status
      await db
        .update(meshyTasks)
        .set({
          status,
          progress,
          modelUrls: payload.model_urls || null,
          thumbnailUrl: payload.thumbnail_url || null,
          videoUrl: payload.video_url || null,
        })
        .where(eq(meshyTasks.previewTaskId, id));

      console.log(`✅ Database updated for preview task: ${id}`);

      // ✅ PREVIEW SUCCEEDED → Trigger Refine Task
      if (status === "SUCCEEDED") {
        console.log("\n🎉 PREVIEW SUCCEEDED!");
        console.log("🔄 Automatically starting REFINE task...");
        
        await startRefineTask(id, task.prompt, task.artStyle);
        
        return res.status(200).json({
          message: "Preview completed, refine task started",
          previewTaskId: id,
          status: "SUCCEEDED",
        });
      }

      // ❌ PREVIEW FAILED
      if (status === "FAILED") {
        console.error("\n❌ PREVIEW FAILED!");
        console.error("Error:", payload.task_error?.message);
        
        await db
          .update(meshyTasks)
          .set({
            status: "FAILED",
            taskError: payload.task_error?.message || "Preview generation failed",
            finishedAt: new Date(),
          })
          .where(eq(meshyTasks.previewTaskId, id));
        
        return res.status(200).json({
          message: "Preview failed",
          previewTaskId: id,
          status: "FAILED",
          error: payload.task_error?.message,
        });
      }

      // 🔄 PREVIEW IN PROGRESS
      return res.status(200).json({
        message: "Preview in progress",
        previewTaskId: id,
        status,
        progress,
      });
    }

    // -----------------------------------
    // HANDLE REFINE TASK
    // -----------------------------------
    if (mode === "refine") {
      console.log("\n🟩 === REFINE TASK UPDATE ===");

      // Find task in database by refineTaskId
      const existingTask = await db
        .select()
        .from(meshyTasks)
        .where(eq(meshyTasks.refineTaskId, id))
        .limit(1);

      if (!existingTask.length) {
        console.warn("⚠️ Refine task not found in database:", id);
        return res.status(404).json({ 
          message: "Refine task not found",
          taskId: id 
        });
      }

      // Process texture URLs
      let processedTextureUrls = null;
      if (payload.texture_urls && payload.texture_urls.length > 0) {
        processedTextureUrls = {};
        payload.texture_urls.forEach((textureObj) => {
          Object.assign(processedTextureUrls, textureObj);
        });
        
        console.log("🎨 Textures received:");
        console.log("   Base Color:", processedTextureUrls.base_color ? "✅" : "❌");
        console.log("   Metallic:", processedTextureUrls.metallic ? "✅" : "❌");
        console.log("   Normal:", processedTextureUrls.normal ? "✅" : "❌");
        console.log("   Roughness:", processedTextureUrls.roughness ? "✅" : "❌");
      }

      // Update refine status
      await db
        .update(meshyTasks)
        .set({
          status,
          progress,
          stage: "refine",
          modelUrls: payload.model_urls || null,
          textureUrls: processedTextureUrls,
          thumbnailUrl: payload.thumbnail_url || null,
          videoUrl: payload.video_url || null,
          finishedAt: status === "SUCCEEDED" ? new Date() : null,
          taskError: status === "FAILED" ? (payload.task_error?.message || "Refine failed") : null,
        })
        .where(eq(meshyTasks.refineTaskId, id));

      console.log(`✅ Database updated for refine task: ${id}`);

      // ✅ REFINE SUCCEEDED
      if (status === "SUCCEEDED") {
        console.log("\n🎉 REFINE SUCCEEDED!");
        console.log("✨ 3D model with PBR textures is ready!");
        console.log("📦 Model formats available:", Object.keys(payload.model_urls || {}));
        
        return res.status(200).json({
          message: "Refine completed successfully",
          refineTaskId: id,
          status: "SUCCEEDED",
          hasTextures: !!processedTextureUrls,
          textureTypes: processedTextureUrls ? Object.keys(processedTextureUrls) : [],
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

    // -----------------------------------
    // UNKNOWN MODE
    // -----------------------------------
    console.warn("⚠️ Unknown webhook mode:", mode);
    return res.status(200).json({
      message: "Unknown mode received",
      mode,
      taskId: id,
    });

  } catch (error) {
    console.error("\n❌ WEBHOOK ERROR:", error.message);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


async function startRefineTask(previewTaskId, prompt, artStyle) {
  try {
    console.log("\n🎨 === STARTING REFINE TASK ===");
    console.log("🆔 Preview Task ID:", previewTaskId);
    console.log("💬 Using prompt:", prompt);

    const refinePayload = {
      mode: "refine",
      preview_task_id: previewTaskId,
      enable_pbr: true, 
      ai_model: "meshy-5", 
      webhook_url: `${process.env.NGROK_SERVER}/api/v1/webhook/meshy`, 
    };

    console.log("📤 Creating Meshy REFINE task...");
    console.log("📤 Payload:", JSON.stringify(refinePayload, null, 2));

    const refineResponse = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refinePayload),
    });

    if (!refineResponse.ok) {
      const error = await refineResponse.text();
      console.error("❌ Meshy REFINE API Error:", refineResponse.status, error);
      
      // Mark task as failed
      await db
        .update(meshyTasks)
        .set({
          status: "FAILED",
          taskError: `Failed to start refine: ${error}`,
          finishedAt: new Date(),
        })
        .where(eq(meshyTasks.previewTaskId, previewTaskId));
      
      return;
    }

    const refineResult = await refineResponse.json();
    const refineTaskId = refineResult.result;

    console.log("✅ Meshy REFINE task created successfully!");
    console.log("🆔 Refine Task ID:", refineTaskId);
    console.log("🔔 Webhook will notify when refine completes");

    // Update database with refine task ID
    await db
      .update(meshyTasks)
      .set({
        refineTaskId,
        status: "REFINING",
        stage: "refine",
        progress: 0,
      })
      .where(eq(meshyTasks.previewTaskId, previewTaskId));

    console.log("✅ Database updated with refine task ID");

  } catch (error) {
    console.error("❌ Error starting refine task:", error.message);
    console.error("Stack:", error.stack);
    
    await db
      .update(meshyTasks)
      .set({
        status: "FAILED",
        taskError: `Refine exception: ${error.message}`,
        finishedAt: new Date(),
      })
      .where(eq(meshyTasks.previewTaskId, previewTaskId));
  }
}

export const getMeshyTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await db
      .select()
      .from(meshyTasks)
      .where(eq(meshyTasks.id, taskId))
      .limit(1);

    if (!task.length) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    const taskData = task[0];

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


export const proxyMeshyModel = async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log("\n🔍 === PROXY REQUEST ===");
    console.log("Task ID:", taskId);

    // Query DB
const [task] = await db
  .select()
  .from(meshyTasks)
  .where(eq(meshyTasks.refineTaskId, taskId))
  .limit(1);


    if (!task) {
      console.error("❌ Task not found");
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("📊 Task Status:", task.status);
    console.log("🔗 Has textureUrls:", !!task.textureUrls);
    console.log("🔗 Has modelUrls:", !!task.modelUrls);

    let modelUrls = task.modelUrls;
    if (typeof modelUrls === "string") {
      try {
        modelUrls = JSON.parse(modelUrls);
      } catch (e) {
        console.error("❌ Failed to parse modelUrls");
        return res.status(500).json({ message: "Invalid model URLs" });
      }
    }

    const hasTextureUrls = task.textureUrls && Object.keys(task.textureUrls).length > 0;
    
    if (!hasTextureUrls) {
      console.log("⚠️ Refined model not ready yet");
      return res.status(202).json({ 
        message: "Model is being refined",
        status: task.status,
        progress: task.progress,
        refineTaskId: task.refineTaskId
      });
    }

    if (!modelUrls) {
      console.error("❌ Model URLs missing");
      return res.status(400).json({ message: "Model URLs missing" });
    }

    // ✅ Get model URL (prefer GLB for web)
    const modelUrl = modelUrls.glb || modelUrls.usdz || modelUrls.fbx;
    
    if (!modelUrl) {
      console.error("❌ No model format available");
      return res.status(404).json({ message: "No model format available" });
    }

    console.log("🎨 Serving refined model:", modelUrl);

    // Fetch from Meshy with timeout
    const response = await axios.get(modelUrl, {
      responseType: "arraybuffer",
      timeout: 300000, 
      headers: {
        "User-Agent": "AimDiscover-Proxy/1.0"
      }
    });

    // Send with proper CORS headers
    res.setHeader("Content-Type", "model/gltf-binary");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

    console.log("✅ Model served successfully");
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    res.status(500).json({ 
      message: "Failed to proxy model",
      error: error.message 
    });
  }
};


