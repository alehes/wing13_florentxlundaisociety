// wing13/src/state.js
// Manages system state: drivers, current assignments, completed jobs.
// In production: replace with a database (Postgres / Supabase).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "../state.json");

const DEFAULT_STATE = {
  drivers: [
    { driver_id: "drv1", name: "Marcus Holm",       vehicle: "Sedan", shift: "06:00–14:00", status: "available", current_location: "Lund centrum" },
    { driver_id: "drv2", name: "Fatima Al-Rashid",  vehicle: "WAV",   shift: "06:00–14:00", status: "available", current_location: "Lund centrum" },
    { driver_id: "drv3", name: "Erik Johansson",    vehicle: "Sedan", shift: "14:00–22:00", status: "standby",   current_location: "Malmö" },
    { driver_id: "drv4", name: "Karin Bergström",   vehicle: "WAV",   shift: "14:00–22:00", status: "standby",   current_location: "Malmö" },
    { driver_id: "drv5", name: "Omar Diallo",       vehicle: "Sedan", shift: "22:00–06:00", status: "off",       current_location: "Helsingborg" },
  ],
  assignments: [],
  completed_jobs: [],
  lastUpdated: null,
};

export function getSystemState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  }
  return DEFAULT_STATE;
}

export function saveSystemState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function resetState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
  console.log("State reset to defaults.");
}