import { eq,or } from "drizzle-orm";
import { meshyTasks } from "../schema/meshy-tasks.js";
import db from "../db/connect.js";
export async function fetchFinal3DModel(taskId) {
  try {
    const response = await fetch(
      `https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, 
      {
        headers: { "Authorization": `Bearer ${process.env.MESHY_API_KEY}` },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch final model: ${errorText}`);
    }

    const result = await response.json();
    const data = result.data || result;

    // ✅ CRITICAL FIX: Store as plain object (NO JSON.stringify!)
    await db.update(meshyTasks)
      .set({
        status: "SUCCEEDED",
        progress: 100,
        modelUrls: {  
          glb: data.glb_url,
          usdz: data.usdz_url,
          fbx: data.fbx_url,
          obj: data.obj_url,
        },
        thumbnailUrl: data.thumbnail_url,
        videoUrl: data.video_url,
        finishedAt: new Date(),
      })
      .where(eq(meshyTasks.taskId, taskId));

    console.log("✅ Final model stored for task:", taskId);
    return data;

  } catch (err) {
    console.error("❌ fetchFinal3DModel error:", err.message);
    await db.update(meshyTasks)
      .set({
        status: "FAILED",
        taskError: err.message,
        finishedAt: new Date(),
      })
      .where(eq(meshyTasks.taskId, taskId));
    throw err;
  }
}
