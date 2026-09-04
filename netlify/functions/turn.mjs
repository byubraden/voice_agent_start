import { nextTurn } from "../../lib/agent.mjs";
import { loadSession, saveSession } from "../../lib/store.mjs";
import { ask, sayAndHangUp, formData } from "../../lib/twiml.mjs";

export default async (req) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");
  const speech = (form.get("SpeechResult") || "").trim();

  const session = await loadSession(callSid);
  if (speech) session.history.push({ role: "user", content: speech });

  let reply;
  let done = false;
  try {
    ({ reply, done } = await nextTurn(session.history));
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

  return done ? sayAndHangUp(reply) : ask(reply);
};

export const config = { path: "/turn" };
