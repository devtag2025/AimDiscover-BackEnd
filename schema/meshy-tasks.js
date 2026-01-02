import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const meshyTasks = pgTable(
  "meshy_tasks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    previewTaskId: varchar("preview_task_id", { length: 100 }).unique().notNull(),
    refineTaskId: varchar("refine_task_id", { length: 100 }).unique(),
    status: varchar("status", { length: 50 }).notNull().default("PENDING"),
    progress: integer("progress").default(0).notNull(),
    stage: varchar("stage", { length: 20 }).default("preview").notNull(),
    prompt: text("prompt").notNull(),
    artStyle: varchar("art_style", { length: 50 }).default("realistic"),
    modelUrls: jsonb("model_urls"),
    textureUrls: jsonb("texture_urls"),
    thumbnailUrl: text("thumbnail_url"),
    videoUrl: text("video_url"),
    taskError: text("task_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
  },
  (table) => ({
    statusStageIdx: index("meshy_tasks_status_stage_idx").on(
      table.status,
      table.stage
    ),
    stageIdx: index("meshy_tasks_stage_idx").on(table.stage),
    createdAtIdx: index("meshy_tasks_created_at_idx").on(table.createdAt),
    finishedAtIdx: index("meshy_tasks_finished_at_idx").on(table.finishedAt),
  })
);
