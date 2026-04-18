// wing13/src/step3_dispatch.js
// Generates a human-readable dispatch email from the optimised plan.
// In production: send via SendGrid / Postmark / SMTP.

/**
 * Generate and "send" the dispatch email.
 * @param {Object} dispatchPlan - output from step2_optimise
 * @param {Array} jobs - all jobs
 * @param {Array} drivers - driver list
 * @returns {{ emailBody: string, to: string, subject: string }}
 */
export async function sendDispatchEmail(dispatchPlan, jobs, drivers) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("sv-SE", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const timeStr = now.toLocaleTimeString("sv-SE", { hour:"2-digit", minute:"2-digit" });

  const lines = [];
  const SEP = "━".repeat(42);

  lines.push(`To: dispatch-coordinator@wing13.se`);
  lines.push(`From: ai@wing13.se`);
  lines.push(`Subject: Wing13 Dispatch Summary — ${now.toLocaleDateString("sv-SE")} · ${jobs.length} jobs · ${dispatchPlan.assignments.length} drivers\n`);
  lines.push(SEP);
  lines.push(`WING13 OPTIMISED DISPATCH PLAN`);
  lines.push(`Date: ${dateStr}`);
  lines.push(`Generated: ${timeStr} by Wing13 AI`);
  lines.push(SEP);
  lines.push("");

  for (const assignment of dispatchPlan.assignments) {
    const driver = drivers.find(d => d.driver_id === assignment.driver_id);
    const vehicleLabel = driver?.vehicle === "WAV" ? "♿ WAV" : "🚗 Sedan";
    lines.push(`DRIVER: ${driver?.name || assignment.driver_id} (${vehicleLabel} · ${driver?.shift || "—"})`);
    lines.push("─".repeat(42));

    for (let i = 0; i < assignment.sequence.length; i++) {
      const s = assignment.sequence[i];
      const job = jobs.find(j => j.job_id === s.job_id);
      const start = s.estimated_start_time?.slice(11, 16) || "—";
      const end = s.estimated_end_time?.slice(11, 16) || "—";
      lines.push(`  ${i + 1}. [${s.job_id}] ${start} → ${s.estimated_end_time ? end : "—"}`);
      lines.push(`         Patient: ${job?.patient || "Unknown"}`);
      if (job?.type === "pickup") {
        lines.push(`         Pick up at: ${job.from}`);
        lines.push(`         Deliver to: ${job.to}`);
      } else {
        lines.push(`         Pick up from: ${job?.from}`);
        lines.push(`         Deliver to: ${job?.to}`);
      }
      if (job?.priority === "high") lines.push(`         ⚠ HIGH PRIORITY — hospital appointment`);
      lines.push(`         Note: ${s.rationale}`);
      lines.push("");
    }
  }

  if (dispatchPlan.unassigned_jobs?.length > 0) {
    lines.push("⚠ UNASSIGNED JOBS:");
    dispatchPlan.unassigned_jobs.forEach(u => lines.push(`  - [${u.job_id}]: ${u.reason}`));
    lines.push("");
  }

  lines.push(SEP);
  lines.push("EFFICIENCY SUMMARY");
  lines.push(`  Total patient wait time:  ${dispatchPlan.efficiency_summary.total_estimated_wait_time_minutes} min`);
  lines.push(`  Total empty travel:        ${dispatchPlan.efficiency_summary.total_empty_travel_minutes} min`);
  lines.push(`  Unassigned jobs:           ${dispatchPlan.unassigned_jobs?.length || 0}`);
  lines.push("");
  lines.push(`KEY INSIGHT: ${dispatchPlan.efficiency_summary.key_insight}`);
  lines.push(SEP);

  const emailBody = lines.join("\n");

  // In production, replace this with real email sending:
  // await sendgrid.send({ to, from, subject, text: emailBody });
  console.log("\n[EMAIL WOULD BE SENT VIA SENDGRID/POSTMARK IN PRODUCTION]\n");

  return {
    to: "dispatch-coordinator@wing13.se",
    subject: `Wing13 Dispatch Summary — ${now.toLocaleDateString("sv-SE")}`,
    emailBody,
  };
}