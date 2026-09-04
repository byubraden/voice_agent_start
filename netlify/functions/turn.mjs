import { nextTurn, emptySlots } from "../../lib/agent.mjs";
import { loadSession, saveSession } from "../../lib/store.mjs";
import { finalize } from "../../lib/finalize.mjs";
import { ask, sayAndHangUp, formData } from "../../lib/twiml.mjs";

export default async (req, context) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");
  const speech = (form.get("SpeechResult") || "").trim();

  const session = await loadSession(callSid);
  session.history.push({
    role: "user",
    content: speech || "(the caller said nothing — check if they are still there)",
  });

  let reply;
  let done = false;
  try {
    const turn = await nextTurn(session.history, session.slots || emptySlots());
    ({ reply, done } = turn);
    session.slots = turn.slots;
    session.failures = 0;
  } catch (err) {
    console.error("agent turn failed", err);
    // Don't hang up on one bad response — ask the caller to repeat and try again.
    // Two in a row means something is actually broken, so end the call politely.
    session.failures = (session.failures || 0) + 1;
    done = session.failures >= 2;
    reply = done
      ? "I am sorry, I am having trouble with my system. Please call back in a few minutes. Goodbye."
      : "Sorry, I missed that. Could you say it again?";
  }

  session.history.push({ role: "assistant", content: reply });
  await saveSession(callSid, session);

  if (!done) return ask(reply);

  // Write the record ourselves rather than relying on the status webhook being
  // configured. waitUntil lets the caller hear the goodbye while this runs.
  const saving = finalize(callSid, session, { from: form.get("From") || "" });
  if (context?.waitUntil) context.waitUntil(saving);
  else await saving;

  return sayAndHangUp(reply);
};

export const config = { path: "/turn" };
