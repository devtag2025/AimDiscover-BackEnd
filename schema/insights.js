import { pgTable, serial, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";

export const insights = pgTable("insights", {
  id: varchar("id", { length: 36 }).primaryKey(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  products: jsonb("products").notNull(),
  categories: jsonb("categories").notNull(),
  keywords: jsonb("keywords").notNull(),
  markets: jsonb("markets").notNull(),
  summary: varchar("summary", { length: 1000 }).notNull(),
}, (table) => ({
  idx_generated_at: index("idx_generated_at").on(table.generatedAt),
}));
