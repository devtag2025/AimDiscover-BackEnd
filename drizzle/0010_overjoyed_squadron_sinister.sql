CREATE TABLE "insights" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"products" jsonb NOT NULL,
	"categories" jsonb NOT NULL,
	"keywords" jsonb NOT NULL,
	"markets" jsonb NOT NULL,
	"summary" varchar(500) NOT NULL
);
