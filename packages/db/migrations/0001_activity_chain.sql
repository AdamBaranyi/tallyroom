ALTER TABLE "activity_events" ADD COLUMN "sequence" bigserial NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_events" ADD COLUMN "previous_hash" text;--> statement-breakpoint
ALTER TABLE "activity_events" ADD COLUMN "hash" text;--> statement-breakpoint
CREATE INDEX "activity_workspace_sequence_idx" ON "activity_events" USING btree ("workspace_id","sequence");