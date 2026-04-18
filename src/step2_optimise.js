// wing13/src/step2_optimise.js
// Calls Claude API to assign drivers and optimise routes given jobs + system state

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Build a travel time matrix between all addresses.
 * In production: replace with Google Maps Distance Matrix API.
 * Here we return mock data for Lund addresses.
 */
function buildTravelTimes(jobs) {
  const HOSPITAL = "Skånes universitetssjukhus, 221 85 Lund";
  const times = [];
  const addresses = [HOSPITAL, ...jobs.map(j => j.from), ...jobs.map(j => j.to)];
  const unique = [...new Set(addresses)];

  // Mock travel times between Lund addresses (minutes)
  const MOCK = {
    default: 12,
    same: 0,
  };

  for (const a of unique) {
    for (const b of unique) {
      if (a === b) continue;
      const isHospA = a.includes("sjukhus") || a.includes("Hospital");
      const isHospB = b.includes("sjukhus") || b.includes("Hospital");
      times.push({
        from: a,
        to: b,
        minutes: isHospA || isHospB ? 8 + Math.floor(Math.random() * 8) : MOCK.default,
      });
    }
  }
  return times;
}

const OPTIMISE_PROMPT = (jobs, drivers, travelTimes, systemState) => `You are an AI dispatch strategist for medical transport in Skåne, Sweden.

Your goal is to assign and sequence patient transport jobs to drivers in a way that minimizes total system inefficiency.

---

INPUT DATA:

<jobs>
${JSON.stringify(jobs, null, 2)}
</jobs>

<drivers>
${JSON.stringify(drivers, null, 2)}
</drivers>

<travel_times>
${JSON.stringify(travelTimes, null, 2)}
</travel_times>

<system_state>
${JSON.stringify(systemState, null, 2)}
</system_state>

---

IMPORTANT CONSTRAINTS:
- Each job transports exactly ONE patient per trip
- No shared rides
- Each job must be assigned to exactly one driver
- A driver can only execute one job at a time
- Jobs must respect time windows and urgency
- WAV vehicle required for wheelchair patients

---

WHAT <system_state> CONTAINS:
This represents the CURRENT LIVE STATE of the system BEFORE reoptimization.
You MUST treat this as ground truth and update it intelligently.

---

OPTIMIZATION OBJECTIVES:
1. Minimize patient waiting time
2. Minimize empty vehicle travel
3. Maximize driver utilization
4. Maintain consistency with existing assignments unless improvement is significant

---

STRATEGIC RULE:
You are performing CONTINUOUS REOPTIMIZATION, not one-shot planning.
- You may KEEP existing assignments if optimal
- You may MODIFY assignments if improvements exist
- You must ensure consistency with system_state

---

OUTPUT FORMAT (STRICT JSON ONLY — no markdown, no explanation outside JSON):

{
  "assignments": [
    {
      "driver_id": "string",
      "sequence": [
        {
          "job_id": "string",
          "estimated_start_time": "ISO-8601",
          "estimated_end_time": "ISO-8601",
          "action": "keep | add | reassign",
          "rationale": "short explanation"
        }
      ]
    }
  ],
  "changes_from_previous_state": [
    {
      "job_id": "string",
      "change": "assigned | moved | removed | unchanged",
      "reason": "why this changed"
    }
  ],
  "unassigned_jobs": [
    {
      "job_id": "string",
      "reason": "explanation"
    }
  ],
  "efficiency_summary": {
    "total_estimated_wait_time_minutes": number,
    "total_empty_travel_minutes": number,
    "key_insight": "string"
  }
}`;

/**
 * Optimise routes given all jobs and system state.
 * @param {Array} jobs
 * @param {Object} systemState - includes drivers, active_assignments, etc.
 * @returns {Promise<Object>} dispatch plan
 */
export async function optimiseRoutes(jobs, systemState) {
  const travelTimes = buildTravelTimes(jobs);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: OPTIMISE_PROMPT(jobs, systemState.drivers, travelTimes, {
        current_time: new Date().toISOString(),
        active_assignments: systemState.assignments || [],
        completed_jobs: systemState.completed_jobs || [],
      }),
    }],
  });

  const text = message.content[0].text;

  // Strip markdown code fences if present
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}