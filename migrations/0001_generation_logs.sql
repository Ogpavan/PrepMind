CREATE TYPE "public"."generation_status" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "generation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid,
	"subject_id" uuid,
	"topic_id" uuid,
	"model" varchar(120) NOT NULL,
	"status" "generation_status" DEFAULT 'queued' NOT NULL,
	"requested_questions" integer DEFAULT 0 NOT NULL,
	"generated_questions" integer DEFAULT 0 NOT NULL,
	"inserted_questions" integer DEFAULT 0 NOT NULL,
	"failed_questions" integer DEFAULT 0 NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_logs" ADD CONSTRAINT "generation_logs_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_logs" ADD CONSTRAINT "generation_logs_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_logs" ADD CONSTRAINT "generation_logs_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_logs" ADD CONSTRAINT "generation_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generation_logs_created_idx" ON "generation_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "generation_logs_status_idx" ON "generation_logs" USING btree ("status");
