ALTER TABLE "meshy_tasks" DROP CONSTRAINT "meshy_tasks_task_id_unique";--> statement-breakpoint
ALTER TABLE "meshy_tasks" ALTER COLUMN "task_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meshy_tasks" ADD COLUMN "refine_task_id" varchar(100);