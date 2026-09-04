import { nextTurn, emptySlots } from "../../lib/agent.mjs";
import { loadSession, saveSession } from "../../lib/store.mjs";
import { finalize } from "../../lib/finalize.mjs";
import { ask, sayAndHangUp, formData } from "../../lib/twiml.mjs";

export default async (req) => {
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
    // A caller one word away from booking was once told "I'm having trouble, goodbye"
    // after two hiccups. Hang up only when the call is clearly unrecoverable, and
    // re-ask the actual question rather than a generic apology the caller can't act on.
    session.failures = (session.failures || 0) + 1;
    done = session.failures >= 4;

    const asked = [...session.history]
      .reverse()
      .find((m) => m.role === "assistant" && m.content.includes("?"));
    // Just the final question sentence, not the whole previous reply.
    const question = asked?.content.match(/[^.!?]*\?/g)?.pop()?.trim();

    reply = done
      ? "I am sorry, my system is not cooperating. Please call back in a few minutes. Goodbye."
      : question
        ? `Sorry, I didn't catch that. ${question}`
        : "Sorry, I didn't catch that. What can I help you with?";
  }

  session.history.push({ role: "assistant", content: reply });
  await saveSession(callSid, session);

  if (!done) return ask(reply);

  // Save before responding. waitUntil looks like the right tool here, but the
  // function is frozen once it returns, so the write never lands and the call is
  // lost unless the caller happens to hang up first. The extra second before the
  // caller hears goodbye is worth not dropping records.
  await finalize(callSid, session, {
    from: form.get("From") || "",
    duration: session.started_at
      ? Math.round((Date.now() - new Date(session.started_at)) / 1000)
      : 0,
  });

  return sayAndHangUp(reply);
};

export const config = { path: "/turn" };
