import { pgTable, varchar, boolean, timestamp, text, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    name: varchar("name", { length: 255 }),
    google_id: varchar("google_id", { length: 255 }),
    picture: text("picture"),
    user_type: varchar("user_type", { length: 50 }).default("user").notNull(),
    password: varchar("password", { length: 255 }),
    is_email_verified: boolean("is_email_verified").default(false).notNull(),
    email_verification_token: varchar("email_verification_token", { length: 500 }),
    email_verification_expires: timestamp("email_verification_expires"),
    reset_password_token: varchar("reset_password_token", { length: 500 }),
    reset_password_expires: timestamp("reset_password_expires"),
    refresh_token_enc: text("refresh_token_enc"),
    stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    googleIdIdx: index("users_google_id_idx").on(table.google_id),
    emailVerificationIdx: index("users_email_verification_token_idx").on(
      table.email_verification_token
    ),
    resetPasswordIdx: index("users_reset_password_token_idx").on(
      table.reset_password_token
    ),
    stripeCustomerIdx: index("users_stripe_customer_id_idx").on(
      table.stripe_customer_id
    ),
  })
);
