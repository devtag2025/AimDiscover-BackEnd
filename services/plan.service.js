// services/plan.service.js
import { db } from "../db/connect.js";
import { plans } from "../schema/index.js";
import { createId } from "@paralleldrive/cuid2";
import Stripe from "stripe";
import { env } from "../config/env.config.js";
import { eq } from "drizzle-orm";
import { ilike } from "drizzle-orm";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export class PlanService {
 async getPlans({ status = "active", search = "" } = {}) {
  try {
    let query = db.select().from(plans);

    if (status === "active") {
      query = query.where(eq(plans.is_active, true));
    }

    if (status === "inactive") {
      query = query.where(eq(plans.is_active, false));
    }

    if (search && typeof search === "string") {
      query = query.where(
        ilike(plans.name, `%${search.replace(/%/g, "\\%")}%`)
      );
    }

    return await query;
  } catch (error) {
    console.error("❌ Failed to fetch plans:", error);
    throw new Error("Could not fetch plans");
  }
}

  async getPlanById(planId) {
    try {
      const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
      if (!plan) throw new Error("Plan not found");
      return plan;
    } catch (error) {
      console.error("❌ Failed to get plan:", error);
      throw new Error(error.message || "Could not get plan");
    }
  }

  async createPlan(data) {
    const {
      name,
      description,
      price,
      currency = "GBP",
      billing_period,
      features = [],
      is_active = true,
      sort_order = 0,
      is_trial = false,
      is_popular = false,
    } = data;

    const id = createId();

    let stripe_product_id = null;
    let stripe_price_id = null;

    try {
      if (!env.STRIPE_SECRET_KEY) {
        console.warn(
          "⚠️ STRIPE_SECRET_KEY missing — skipping Stripe creation."
        );
      } else {
        // ✅ Create product on Stripe
        const product = await stripe.products.create({
          name,
          description,
          metadata: { plan_id: id },
        });
        stripe_product_id = product.id;

        // ✅ Create price on Stripe
        const priceData = {
          product: product.id,
          unit_amount: price,
          currency: currency.toLowerCase(),
          metadata: { plan_id: id },
        };

        if (billing_period && billing_period !== "one_time") {
          priceData.recurring = {
            interval: billing_period === "yearly" ? "year" : "month",
          };
        }

        const priceObj = await stripe.prices.create(priceData);
        stripe_price_id = priceObj.id;
      }
    } catch (err) {
      console.error("❌ Stripe plan creation failed:", err);
      stripe_product_id = `dev_product_${id}`;
      stripe_price_id = `dev_price_${id}`;
    }

    // ✅ Save plan in DB
    try {
      const [created] = await db
        .insert(plans)
        .values({
          id,
          name,
          description,
          price,
          currency,
          billing_period,
          stripe_product_id,
          stripe_price_id,
          features,
          is_active,
          sort_order,
          is_trial,
          is_popular,
        })
        .returning();

      return created;
    } catch (error) {
      console.error("❌ Failed to save plan in DB:", error);
      throw new Error("Could not create plan");
    }
  }
async updatePlan(planId, data) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan) throw new Error("Plan not found");

  // 🟡 Stripe product update
  if (plan.stripe_product_id && (data.name || data.description)) {
    await stripe.products.update(plan.stripe_product_id, {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
    });
  }

  // 🔴 Price change → create NEW Stripe price
  if (
    data.price &&
    data.price !== plan.price
  ) {
    const newPrice = await stripe.prices.create({
      product: plan.stripe_product_id,
      unit_amount: data.price,
      currency: plan.currency.toLowerCase(),
      recurring: plan.billing_period
        ? { interval: plan.billing_period === "yearly" ? "year" : "month" }
        : undefined,
      metadata: { plan_id: plan.id },
    });

    data.stripe_price_id = newPrice.id;
  }

  const [updated] = await db
    .update(plans)
    .set(data)
    .where(eq(plans.id, planId))
    .returning();

  return updated;
}


  // 🟢 Delete (deactivate) plan
  async deletePlan(planId) {
    try {
      const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
      if (!plan) throw new Error("Plan not found");

      const [deleted] = await db
        .update(plans)
        .set({ is_active: false })
        .where(eq(plans.id, planId))
        .returning();

      return deleted;
    } catch (error) {
      console.error("❌ Failed to delete plan:", error);
      throw new Error(error.message || "Could not delete plan");
    }
  }
}

export const planService = new PlanService();
