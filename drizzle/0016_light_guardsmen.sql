CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_email_verification_token_idx" ON "users" USING btree ("email_verification_token");--> statement-breakpoint
CREATE INDEX "users_reset_password_token_idx" ON "users" USING btree ("reset_password_token");--> statement-breakpoint
CREATE INDEX "users_stripe_customer_id_idx" ON "users" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "meshy_tasks_status_stage_idx" ON "meshy_tasks" USING btree ("status","stage");--> statement-breakpoint
CREATE INDEX "meshy_tasks_stage_idx" ON "meshy_tasks" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "meshy_tasks_created_at_idx" ON "meshy_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meshy_tasks_finished_at_idx" ON "meshy_tasks" USING btree ("finished_at");