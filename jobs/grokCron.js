import cron from "node-cron";
import { GrokService } from "../services/grok.service.js";

export let grokTask = null;

export const startGrokCron = (expression = "0 6 * * *", options = { timezone: "UTC" }) => {
  console.log("Scheduling Grok cron with expression:", expression, "options:", options);

  if (!cron.validate(expression)) {
    console.error("Invalid cron expression:", expression);
    return null;
  }

  function logError(label, err) {
  console.error(label);
  console.error(JSON.stringify({
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
    code: err?.code,
    cause: err?.cause,
    response: err?.response?.data,
  }, null, 2));
}


  grokTask = cron.schedule(
    expression,
    async () => {
      const start = new Date();
      console.log(`[GrokCron] run start: ${start.toISOString()}`);
      try {
        const insights = await GrokService.GetGrokInsights();
        await GrokService.CreateAnalysis({
          products: insights.products,
          categories: insights.categories,
          keywords: insights.keywords,
          markets: insights.markets,
          summary: insights.summary,
           platforms: insights.platforms ?? [],
  sentiment: insights.sentiment ?? { global_score: 0, remarks: "" },

  // support both names (your DB column is assumptions_global but your JSON is assumptionsGlobal)
  assumptionsGlobal: insights.assumptionsGlobal ?? insights.assumptions_global ?? [],
        });
        console.log("[GrokCron] run success:", new Date().toISOString());
      } catch (err) {
        logError("[GrokCron] run error", err);
      } finally {
        const end = new Date();
        console.log(`[GrokCron] run finished: ${end.toISOString()} (duration: ${end - start}ms)`);
      }
    },
    { ...options, scheduled: true }
  );

  console.log("Grok cron scheduled. scheduled =", grokTask?.scheduled);
  return grokTask;
};