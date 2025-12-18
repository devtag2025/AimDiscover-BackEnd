import { env } from "../config/env.config.js";
import { createId } from "@paralleldrive/cuid2";
import { meshyTasks } from "../schema/meshy-tasks.js";
import db from "../db/connect.js";
const MESHY_API_KEY = process.env.MESHY_API_KEY;

async function generate3DModelWithMeshy(productDescription, artStyle = "realistic") {
  try {
    console.log("\n🎨 === GENERATING 3D MODEL ===");
    console.log("📝 Original description length:", productDescription.length);

    const meshyPrompt = productDescription;
    console.log("📝 Shortened prompt length:", meshyPrompt.length);
    console.log("💬 Meshy prompt:", meshyPrompt);



const createPayload = {
  mode: "preview",
  prompt: meshyPrompt,
  art_style: artStyle || "realistic",
  ai_model: "latest",        // let it use Meshy 6 Preview
  should_remesh: true,       // cleaner topology at target_polycount
  topology: "triangle",      // or omit and use default
  target_polycount: 300000,   // or a bit higher, but not 200k
  symmetry_mode: "on",     // especially important for characters/products
  webhook_url: `${env.NGROK_SERVER}/api/v1/webhook/meshy`,
};


    console.log("📤 Creating Meshy PREVIEW task with webhook...");
    console.log("📤 Payload:", JSON.stringify(createPayload, null, 2));

    const createResponse = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("❌ Meshy API Create Error:", createResponse.status, error);
      return {
        error: "Meshy API create failed",
        status: createResponse.status,
        details: error,
        fallback: true,
      };
    }

    const createResult = await createResponse.json();
    const previewTaskId = createResult.result;

    console.log("✅ Meshy PREVIEW task created successfully!");
    console.log("🆔 Preview Task ID:", previewTaskId);
    console.log("🔔 Webhook will notify when preview completes");

    const newTask = await db.insert(meshyTasks).values({
      id: createId(),
      previewTaskId: previewTaskId,
      refineTaskId: null,
      status: "PENDING",
      progress: 0,
      stage: "preview",
      prompt: meshyPrompt,
      artStyle,
      createdAt: new Date()
    }).returning();

    console.log("✅ Task stored in database with ID:", newTask[0].id);

    return {
      success: true,
      message: "3D model preview generation started. Webhook will notify on completion.",
      taskId: newTask[0].id,
      previewTaskId,
      prompt: meshyPrompt,
      artStyle,
      status: "PENDING",
      progress: 0
    };

  } catch (error) {
    console.error("❌ Error generating 3D model:", error.message);
    console.error("Stack:", error.stack);
    return {
      error: "Exception in 3D generation",
      message: error.message,
      fallback: true,
    };
  }
}

export default generate3DModelWithMeshy;