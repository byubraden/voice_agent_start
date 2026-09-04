import { nextTurn } from "../../lib/agent.mjs";
import { loadSession, saveSession } from "../../lib/store.mjs";
import { ask, sayAndHangUp, formData } from "../../lib/twiml.mjs";

export default async (req) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");
  const speech = (form.get("SpeechResult") || "").trim();

  const session = await loadSession(callSid);
  if (speech) session.history.push({ role: "user", content: speech });

  let reply = "Sorry, I am having trouble right now. Please call back. Goodbye.";
  let done = true;
  try {
    ({ reply, done } = await nextTurn(session.history));
  } catch (err) {
    console.error("agent turn failed", err);
  }

  session.history.push({ role: "assistant", content: reply });
  await saveSession(callSid, session);

  return done ? sayAndHangUp(reply) : ask(reply);
};

export const config = { path: "/turn" };
