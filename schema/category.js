import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const categories = pgTable("categories", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => createId()), 
  name: varchar("name", { length: 255 })
    .notNull()
    .unique(), 
  ai_prompt: text("ai_prompt")
    .notNull(), 
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});
