import db from "../db/connect.js";
import { faqs } from "../schema/faq.js";
import { eq } from "drizzle-orm";

export class FaqSerivce {
  static async getFaqGrouped() {
    const rows = await db
      .select()
      .from(faqs)
      .where(eq(faqs.isActive, true))
      .orderBy(faqs.category, faqs.sortOrder, faqs.id);

    const map = new Map();

    for (const row of rows) {
      if (!map.has(row.category)) {
        map.set(row.category, {
          category: row.category,
          questions: [],
        });
      }

      map.get(row.category).questions.push({
        q: row.question,
        a: row.answer,
      });
    }

    return Array.from(map.values());
  }

  static async getFaqFlatForAdmin() {
  const rows = await db
    .select({
      id: faqs.id,
      category: faqs.category,
      question: faqs.question,
      answer: faqs.answer,
      sortOrder: faqs.sortOrder,
      isActive: faqs.isActive,
    })
    .from(faqs)
    .orderBy(faqs.category, faqs.sortOrder, faqs.id);

  return rows;
}


// faq.service.js

static async createFaqEntry({
  category,
  question,
  answer,
  sortOrder,
  isActive,
}) {
  const payload = {
    category: category.trim(),
    question: question.trim(),
    answer: answer.trim(),
    sortOrder:
      typeof sortOrder === "number" && !Number.isNaN(sortOrder)
        ? sortOrder
        : 0,
    isActive:
      typeof isActive === "boolean"
        ? isActive
        : true,
  };

  const [inserted] = await db.insert(faqs).values(payload).returning();
  return inserted;
}

static async updateFaqById(id, { category, question, answer, sortOrder, isActive }) {
  const updateData = {};

  if (typeof category === "string") {
    updateData.category = category.trim();
  }
  if (typeof question === "string") {
    updateData.question = question.trim();
  }
  if (typeof answer === "string") {
    updateData.answer = answer.trim();
  }
  if (typeof sortOrder === "number" && !Number.isNaN(sortOrder)) {
    updateData.sortOrder = sortOrder;  
  }
  if (typeof isActive === "boolean") {
    updateData.isActive = isActive;    
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error("No fields to update");
    err.code = "NO_FIELDS";
    throw err;
  }

  const [updated] = await db
    .update(faqs)
    .set(updateData)
    .where(eq(faqs.id, id))
    .returning();

  return updated;
}

static async deleteFaq(id) {
  return await db
    .delete(faqs)
    .where(eq(faqs.id, id))
    .returning();
}

}
