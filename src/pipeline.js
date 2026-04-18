// wing13/src/pipeline.js
// Main pipeline: reads email files → extracts jobs → optimises routes → sends dispatch email
// Usage: node src/pipeline.js

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseJobsFromEmail } from "./step1_parse.js";
import { optimiseRoutes } from "./step2_optimise.js";
import { sendDispatchEmail } from "./step3_dispatch.js";
import { getSystemState, saveSystemState } from "./state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMAILS_DIR = path.join(__dirname, "../emails");

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Wing13 — Medical Transport Pipeline");
  console.log("═══════════════════════════════════════\n");

  // 1. Read all email files from /emails directory
  const emailFiles = fs.readdirSync(EMAILS_DIR).filter(f => f.endsWith(".txt"));
  console.log(`📨 Found ${emailFiles.length} email(s) to process\n`);

  const allJobs = [];

  // STEP 1: Parse each email
  for (const file of emailFiles) {
    const emailText = fs.readFileSync(path.join(EMAILS_DIR, file), "utf-8");
    console.log(`⚙️  Parsing: ${file}`);
    const jobs = await parseJobsFromEmail(emailText);
    console.log(`   → Extracted ${jobs.length} job(s): ${jobs.map(j => j.job_id).join(", ")}\n`);
    allJobs.push(...jobs);
  }

  console.log(`✅ Step 1 complete. Total jobs: ${allJobs.length}\n`);
  console.log("Jobs extracted:");
  allJobs.forEach(j => console.log(`  [${j.job_id}] ${j.patient} | ${j.type} | priority: ${j.priority}`));
  console.log();

  // Load system state (drivers, current assignments)
  const systemState = getSystemState();

  // STEP 2: Optimise routes
  console.log("🗺  Running route optimisation...");
  const dispatchPlan = await optimiseRoutes(allJobs, systemState);
  console.log("✅ Step 2 complete.\n");
  console.log("Efficiency summary:");
  console.log(`  Wait time: ${dispatchPlan.efficiency_summary.total_estimated_wait_time_minutes} min`);
  console.log(`  Empty travel: ${dispatchPlan.efficiency_summary.total_empty_travel_minutes} min`);
  console.log(`  Insight: ${dispatchPlan.efficiency_summary.key_insight}\n`);

  // Save updated state
  saveSystemState({ ...systemState, assignments: dispatchPlan.assignments, lastUpdated: new Date().toISOString() });

  // STEP 3: Send dispatch email
  console.log("📧 Generating and sending dispatch email...");
  const emailResult = await sendDispatchEmail(dispatchPlan, allJobs, systemState.drivers);
  console.log("✅ Step 3 complete.\n");
  console.log("Dispatch email preview:");
  console.log("─".repeat(50));
  console.log(emailResult.emailBody);
  console.log("─".repeat(50));
  console.log("\n✅ Wing13 pipeline complete.\n");
}

main().catch(console.error);