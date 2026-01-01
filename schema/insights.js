import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  index
} from "drizzle-orm/pg-core";

export const insights = pgTable(
  "insights",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    summary: varchar("summary", { length: 1000 }).notNull(),
    products: jsonb("products").notNull(),
    categories: jsonb("categories").notNull(),
    keywords: jsonb("keywords").notNull(),
    markets: jsonb("markets").notNull(),
    platforms: jsonb("platforms").notNull(),
    sentiment: jsonb("sentiment").notNull(),
    assumptions_global: jsonb("assumptions_global"),
  },
  (table) => ({
    idx_generated_at: index("idx_generated_at").on(table.generatedAt),
  })
);
