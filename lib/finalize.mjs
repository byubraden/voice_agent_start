import { extractOutcome } from "./agent.mjs";
import { finalizeCall, isFinalized } from "./store.mjs";

// Writes the call record. Safe to call twice — whichever path gets there first wins,
// so a hangup and a clean goodbye can both trigger it without duplicating.
export async function finalize(callSid, session, { duration = 0, from = "" } = {}) {
  if (await isFinalized(callSid)) return;

  let outcome = { caller_name: "", service: "", appointment: "", summary: "", booked: false };
  try {
    outcome = await extractOutcome(session.history || []);
  } catch (err) {
    console.error("extraction failed", err);
    outcome.summary = "Call ended, but the summary could not be generated.";
  }

  await finalizeCall(callSid, {
    id: callSid,
    from: session.from || from,
    ended_at: new Date().toISOString(),
    duration_seconds: Number(duration || 0),
    transcript: session.history || [],
    ...outcome,
  });
}
