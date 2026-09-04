import { emptySlots } from "../../lib/agent.mjs";
import { getConfig } from "../../lib/config.mjs";
import { saveSession } from "../../lib/store.mjs";
import { ask, formData } from "../../lib/twiml.mjs";

export default async (req) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");
  const business = await getConfig();
  const greeting = `Thanks for calling ${business.name}. How can I help you today?`;

  const from = form.get("From") || "";

  await saveSession(callSid, {
    from,
    started_at: new Date().toISOString(),
    // Caller ID is already a callback number. Prefilling it stops the agent from
    // demanding a number the phone company handed us before the caller said a word.
    slots: { ...emptySlots(), callback: from },
    history: [{ role: "assistant", content: greeting }],
  });

  return ask(greeting);
};

export const config = { path: "/voice" };
