import db from "../db/connect.js";
import { eq } from "drizzle-orm";
import { meshyTasks } from "../schema/meshy-tasks.js";

class WebhookService {
  async taskById(id) {
    const existingTask = await db
      .select()
      .from(meshyTasks)
      .where(eq(meshyTasks.previewTaskId, id))
      .limit(1);

    return existingTask;
  }
    
  
  async updateTaskById({ id, status, progress, payload }) {
    return await db
      .update(meshyTasks)
      .set({
        status,
        progress,
        modelUrls: payload?.model_urls ?? null,
        thumbnailUrl: payload?.thumbnail_url ?? null,
        videoUrl: payload?.video_url ?? null,
      })
      .where(eq(meshyTasks.previewTaskId, id));
  }

  async failPreviewTask({ id, payload }) {
    return await db
      .update(meshyTasks)
      .set({
        status: "FAILED",
        taskError: payload?.task_error?.message ?? "Preview generation failed",
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meshyTasks.previewTaskId, id));
  }

  async taskByPreviewId(id) {
    const result = await db
      .select()
      .from(meshyTasks)
      .where(eq(meshyTasks.previewTaskId, id))
      .limit(1);

    return result[0] || null;
  }

  async taskByRefineId(id) {
    const result = await db
      .select()
      .from(meshyTasks)
      .where(eq(meshyTasks.refineTaskId, id))
      .limit(1);

    return result[0] || null;
  }

  processTextureUrls(textureUrls) {
    if (!Array.isArray(textureUrls) || textureUrls.length === 0) {
      return null;
    }

    const processed = {};
    textureUrls.forEach((textureObj) => {
      Object.assign(processed, textureObj);
    });

    return processed;
  }

  async updateRefineTask({ id, status, progress, payload }) {
    const processedTextureUrls = this.processTextureUrls(payload?.texture_urls);

    return await db
      .update(meshyTasks)
      .set({
        status,
        progress,
        stage: "refine",
        modelUrls: payload?.model_urls ?? null,
        textureUrls: processedTextureUrls,
        thumbnailUrl: payload?.thumbnail_url ?? null,
        videoUrl: payload?.video_url ?? null,
        finishedAt: status === "SUCCEEDED" ? new Date() : null,
        taskError:
          status === "FAILED"
            ? (payload?.task_error?.message ?? "Refine failed")
            : null,
        updatedAt: new Date(),
      })
      .where(eq(meshyTasks.refineTaskId, id));
  }

  async setRefineStarted({ previewTaskId, refineTaskId }) {
    return await db
      .update(meshyTasks)
      .set({
        refineTaskId,
        status: "REFINING",
        stage: "refine",
        progress: 0,
        updatedAt: new Date(),
      })
      .where(eq(meshyTasks.previewTaskId, previewTaskId));
  }

  async setRefineFailed({ previewTaskId, error }) {
    return await db
      .update(meshyTasks)
      .set({
        status: "FAILED",
        taskError: `Refine exception: ${error.message}`,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meshyTasks.previewTaskId, previewTaskId));
  }

  async getTaskById(taskId) {
    const task = await db
      .select()
      .from(meshyTasks)
      .where(eq(meshyTasks.id, taskId))
      .limit(1);

    return task[0] || null;
  }

  async getRefineTaskByRefineId(refineTaskId) {
    const [task] = await db
      .select()
      .from(meshyTasks)
      .where(eq(meshyTasks.refineTaskId, refineTaskId))
      .limit(1);

    return task || null;
  }

  parseModelUrls(modelUrls) {
    if (!modelUrls) return null;
    if (typeof modelUrls === "string") {
      try {
        return JSON.parse(modelUrls);
      } catch {
        return null;
      }
    }
    return modelUrls;
  }
}

const webhookService = new WebhookService();
export default webhookService;
