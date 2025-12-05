import db from "../db/connect.js";
import { faqs } from "../schema/faq.js";
import { eq } from "drizzle-orm";

export class FaqSerivce{
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

static async createFaqEntry({ category, question, answer, sort_order , is_active}) {

  const payload = {
    category: category.trim(),
    question: question.trim(),
    answer: answer.trim(),
    sortOrder: sort_order ?? 0,
    isActive: is_active ?? true
  };

  const inserted = await db.insert(faqs).values(payload).returning();
  return inserted[0];
}

}

