import { EmailLog } from "../models/EmailLog.js";

const DAILY_LIMIT = 450;
const PER_RECIPIENT_LIMIT = 5;
const PER_RECIPIENT_WINDOW_MS = 60 * 60 * 1000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 15 * 60 * 1000;

let dailyCount = 0;
let dailyResetDate = new Date().toDateString();

const recipientCounts = new Map<string, { count: number; windowStart: number }>();

let circuitFailCount = 0;
let circuitOpenUntil = 0;

function resetDailyIfNewDay() {
  const today = new Date().toDateString();
  if (today !== dailyResetDate) {
    dailyCount = 0;
    dailyResetDate = today;
  }
}

export function isCircuitOpen(): boolean {
  if (circuitFailCount < CIRCUIT_BREAKER_THRESHOLD) return false;
  if (Date.now() > circuitOpenUntil) {
    circuitFailCount = 0;
    return false;
  }
  return true;
}

export function recordCircuitFailure() {
  circuitFailCount += 1;
  if (circuitFailCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    console.warn(`[email] Circuit breaker OPEN — pausing sends for ${CIRCUIT_BREAKER_COOLDOWN_MS / 60000}min after ${circuitFailCount} consecutive failures`);
  }
}

export function recordCircuitSuccess() {
  circuitFailCount = 0;
}

export function canSendGlobally(): boolean {
  resetDailyIfNewDay();
  if (dailyCount >= DAILY_LIMIT) {
    console.warn(`[email] Daily quota exhausted (${dailyCount}/${DAILY_LIMIT})`);
    return false;
  }
  if (isCircuitOpen()) {
    console.warn("[email] Circuit breaker is open, skipping send");
    return false;
  }
  return true;
}

export function canSendToRecipient(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = recipientCounts.get(key);

  if (!entry || now - entry.windowStart > PER_RECIPIENT_WINDOW_MS) {
    recipientCounts.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= PER_RECIPIENT_LIMIT) {
    console.warn(`[email] Per-recipient rate limit hit for ${key} (${entry.count}/${PER_RECIPIENT_LIMIT} per hour)`);
    return false;
  }

  entry.count += 1;
  return true;
}

export function incrementDailyCount() {
  resetDailyIfNewDay();
  dailyCount += 1;
}

export async function logEmail(params: {
  to: string;
  template: string;
  orderId?: string;
  subject: string;
  status: "sent" | "failed" | "skipped_quota" | "skipped_rate" | "skipped_circuit" | "skipped_dedup";
  errorMessage?: string;
}) {
  try {
    await EmailLog.create({
      to: params.to,
      template: params.template,
      orderId: params.orderId || undefined,
      subject: params.subject,
      status: params.status,
      errorMessage: params.errorMessage
    });
  } catch (err) {
    console.error("[email] Failed to write email log:", err);
  }
}
