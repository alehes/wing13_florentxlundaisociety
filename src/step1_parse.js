// wing13/src/step1_parse.js
// Calls Claude API to extract structured job data from raw nurse emails

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PARSE_PROMPT = (emailText) => `You will be extracting structured information from one or more emails and formatting the data as JSON objects.

Here is the email text you need to process:

<email>
${emailText}
</email>

Your task is to carefully read the email(s) and extract the following information to create JSON object(s). Each email may contain information about one or more patients/jobs.

For each patient/job mentioned in the emails, extract these fields:

- job_id: Assign an ID based on the job type. Use "p1", "p2", "p3", etc. for patients being picked up from home and taken TO the hospital. Use "d1", "d2", "d3", etc. for patients being picked up FROM the hospital and taken home (discharged).
- type: The type of job. Use "pickup" if the patient is being picked up from home and taken to the hospital. Use "discharged" if the patient is being picked up from the hospital and taken home.
- patient: The full name of the patient (first and last name).
- from: The complete pickup/origin address. Include street address and city if available.
- to: The complete destination address. Include street address and city if available.
- time_window_start: The start of the time window in ISO 8601 format (YYYY-MM-DDTHH:MM:SS). If a time range is given (e.g., "between 8:30 and 9:30"), use the earlier time. If only one time is mentioned, subtract 30 minutes to create the window start.
- time_window_end: The end of the time window in ISO 8601 format (YYYY-MM-DDTHH:MM:SS). If a time range is given, use the later time. If only one time is mentioned, add 30 minutes to create the window end.
- priority: Set to "high" if the destination is a hospital (patient is being taken TO the hospital). Set to "normal" if the destination is not a hospital (patient is being taken home or to another non-hospital location).

Important formatting and extraction rules:
- All dates and times must be in ISO 8601 format: YYYY-MM-DDTHH:MM:SS
- Use 24-hour time format (e.g., 14:30:00 for 2:30 PM)
- If the year is not mentioned, use the current year
- If the date is given as a day of the week or relative date (e.g., "tomorrow", "next Monday"), convert it to an actual date
- Addresses should be complete and properly formatted
- If multiple patients are mentioned in the emails, create a separate JSON object for each one
- Number the job_ids sequentially within each type (all pickups get p1, p2, p3...; all discharged get d1, d2, d3...)

Before providing your final answer, use the scratchpad to work through the email content systematically:

<scratchpad>
- Identify how many patients/jobs are mentioned
- For each patient, note: name, pickup location, destination, time information, and whether they're going to or from the hospital
- Determine the job_id and type for each
- Determine the priority for each based on destination
- Convert all times to ISO 8601 format
- Map each piece of information to the correct JSON field
</scratchpad>

Then provide your final answer inside <answer> tags as a JSON object (single job) or JSON array (multiple jobs).`;

/**
 * Parse one email text and return an array of job objects.
 * @param {string} emailText
 * @returns {Promise<Array>}
 */
export async function parseJobsFromEmail(emailText) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: PARSE_PROMPT(emailText) }],
  });

  const text = message.content[0].text;

  // Extract JSON from <answer> tags
  const match = text.match(/<answer>([\s\S]*?)<\/answer>/);
  if (!match) throw new Error("No <answer> tags found in response");

  const raw = match[1].trim();
  const parsed = JSON.parse(raw);

  // Normalise to array
  return Array.isArray(parsed) ? parsed : [parsed];
}