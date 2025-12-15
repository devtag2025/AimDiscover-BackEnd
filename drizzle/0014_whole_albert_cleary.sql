ALTER TABLE "faqs" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "insights" ADD COLUMN "platforms" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "insights" ADD COLUMN "sentiment" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "insights" ADD COLUMN "assumptions_global" jsonb NOT NULL;