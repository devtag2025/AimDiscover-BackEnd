import {
  pgTable,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const faqs = pgTable("faqs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
