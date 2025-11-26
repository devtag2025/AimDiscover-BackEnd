ALTER TABLE "meshy_tasks" ALTER COLUMN "progress" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meshy_tasks" ALTER COLUMN "prompt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meshy_tasks" ALTER COLUMN "art_style" SET DEFAULT 'realistic';--> statement-breakpoint
ALTER TABLE "meshy_tasks" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meshy_tasks" ADD COLUMN "preview_task_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "meshy_tasks" ADD COLUMN "stage" varchar(20) DEFAULT 'preview' NOT NULL;--> statement-breakpoint
ALTER TABLE "meshy_tasks" DROP COLUMN "task_id";--> statement-breakpoint
ALTER TABLE "meshy_tasks" ADD CONSTRAINT "meshy_tasks_preview_task_id_unique" UNIQUE("preview_task_id");--> statement-breakpoint
ALTER TABLE "meshy_tasks" ADD CONSTRAINT "meshy_tasks_refine_task_id_unique" UNIQUE("refine_task_id");