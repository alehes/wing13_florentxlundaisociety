# Wing13

**AI-powered patient transport coordination for Swedish hospital wards.**

Wing13 serves as the middle man in patient transportation by reducing delays, improving driver utilisation, and enabling faster patient discharge.

---

## Problem

Hospital transport coordination is often manual and time-consuming, dependent on phone calls between wards and dispatch. This leads to inefficient pick up and drop offs and missed same-day discharges which cost an estimate of 10k sek per patient. Taking SUS as an example, 250 inpatients are discharged daily, 30-50% require hospital provided transport. If 10% of these patients are not picked up on the same day they are discharged it costs the hospital an additional 80-125k a day. Not to mention the delay of care of the next patients to be admitted. 

---

## Solution

Wing13 acts as a middlelayer seeking to reduce wait time for patient and take advantage of trips planned by the hospital. 

---

## 🧩 System Architecture

```id="arch1"
Nurse emails (.txt)
        ↓
[Step 1] AI Parsing (Claude)
        ↓
Structured Job JSON
        ↓
[Step 2] AI Optimisation (Claude)
        ↓
Driver Assignments + Routes
        ↓
[Step 3] Dispatch Generation
        ↓
Dispatch Email

        ↑
   System State
(drivers, assignments)
```

---

## How it works (example data)

### Step 0 — Setup
src/state.js loads the current system state from state.json: 5 drivers (2 sedans, 2 WAVs, 1 night sedan) across three shifts, plus any existing assignments and completed jobs.

### Step 1 — Parse emails (src/step1_parse.js)
Every .txt file in /emails is sent to Claude (Sonnet 4.6). Claude reads the nurse's natural-language email and extracts structured JSON — patient name, pickup address, destination, time window, job type (pickup = home→hospital, discharged = hospital→home). All emails are parsed in parallel. Afterwards, job IDs are renumbered globally (p1, p2... d1, d2...) to avoid collisions.

### Step 2 — Optimise routes (src/step2_optimise.js)
All jobs + all drivers + a mock travel time matrix are sent to Claude in a single prompt. Claude acts as a dispatch strategist and returns a full assignment plan as JSON: which driver gets which jobs, in what sequence, with estimated start/end times and a rationale for each decision. It respects constraints (WAV for wheelchair patients, shift hours, one patient per trip) and can keep or modify existing assignments from state.

### Step 3 — Generate dispatch email (src/step3_dispatch.js)
The optimised plan is formatted into a human-readable dispatch email — driver by driver, job by job, with times, patient names, addresses, and high-priority flags. In production this would go via SendGrid; in demo it prints to console.

### Step 4 — Save state
src/pipeline.js writes the new assignments back to state.json so the next run can do continuous re-optimisation rather than starting from scratch."

---

## 🖼 Demo

### 📩 Example Email Input

*Add screenshot of email*

![Example Email](./assets/example-email.png)

---

### Route Planning / Map

*Add route visualisation*

![Map](./assets/map.png)

---

### Dispatch Output

*Add dispatch email screenshot*

![Dispatch](./assets/dispatch.png)


### ⚠️ Note

The UI currently uses **mock data for demonstration purposes**.
It represents how the system would behave when connected to the live pipeline.

---

## 🗂 Project Structure

```id="struct1"
wing13/
├── src/
│   ├── pipeline.js        # Main pipeline
│   ├── step1_parse.js     # Email → structured jobs (AI)
│   ├── step2_optimise.js  # Route optimisation (AI)
│   ├── step3_dispatch.js  # Dispatch email generation
│   └── state.js           # System state
│
├── demo-ui/               # React UI (mock data demo)
├── emails/                # Input email files
├── assets/                # Screenshots for README
├── traveltime.py          # Real routing (OSRM prototype)
├── .env.example
└── package.json
```

---

## Quick start

```bash id="runmain"
# 1. Install dependencies
npm install

# 2. Set API key
cp .env.example .env
# Add your ANTHROPIC_API_KEY

# 3. Add emails to /emails

# 4. Run pipeline
npm start
```

---

## Example Emails

Wing13 works with natural language — no strict format required.

**Discharge (hospital → home):**

> “Birgitta Lindström is ready to go home. She lives at Trollebergsvägen 65, Lund and is available from 10:00.”

**Pickup (home → hospital):**

> “Rolf Andersson needs to be at SUS Lund for his 09:30 appointment. Pick him up from Spolegatan 14 between 08:30 and 09:00.”

---

## Real-World Integration

For demo reliability, travel times are mocked.

A routing module is included:

**`traveltime.py`**

* Uses OpenStreetMap + OSRM
* Computes real driving times
* Can replace the mock routing layer

---

## ⚠️ Limitations

* Static `.txt` emails (no live inbox)
* Mock travel times
* No real-time updates
* UI uses mock data

---

## GDPR Considerations

Wing13 processes patient data (names and addresses).

In production:

* Use EU-hosted infrastructure
* Sign Data Processing Agreements
* Auto-delete patient data after transport
* Maintain audit logs

---

## Tech Stack

* Node.js
* Claude (Anthropic API)
* Python (OSRM routing prototype)
* React (UI demo)

---
