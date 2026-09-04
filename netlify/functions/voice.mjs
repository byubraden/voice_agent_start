import { businessName } from "../../lib/agent.mjs";
import { saveSession } from "../../lib/store.mjs";
import { ask, formData } from "../../lib/twiml.mjs";

export default async (req) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");
  const greeting = `Thanks for calling ${businessName()}. I can book you an appointment. Who am I speaking with?`;

  await saveSession(callSid, {
    from: form.get("From") || "",
    started_at: new Date().toISOString(),
    history: [{ role: "assistant", content: greeting }],
  });

  return ask(greeting);
};

export const config = { path: "/voice" };
