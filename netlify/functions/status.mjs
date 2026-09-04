import { extractOutcome } from "../../lib/agent.mjs";
import { loadSession, finalizeCall, isFinalized } from "../../lib/store.mjs";
import { formData } from "../../lib/twiml.mjs";

export default async (req) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");

  if (form.get("CallStatus") !== "completed") return new Response("", { status: 204 });
  if (await isFinalized(callSid)) return new Response("", { status: 204 });

  const session = await loadSession(callSid);
  let outcome = { caller_name: "", service: "", appointment: "", summary: "", booked: false };
  try {
    outcome = await extractOutcome(session.history);
  } catch (err) {
    console.error("extraction failed", err);
    outcome.summary = "Call ended, but the summary could not be generated.";
  }

  await finalizeCall(callSid, {
    id: callSid,
    from: session.from || form.get("From") || "",
    ended_at: new Date().toISOString(),
    duration_seconds: Number(form.get("CallDuration") || 0),
    transcript: session.history,
    ...outcome,
  });

  return new Response("", { status: 204 });
};

export const config = { path: "/status" };
