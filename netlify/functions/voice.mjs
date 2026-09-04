import { emptySlots } from "../../lib/agent.mjs";
import { getConfig } from "../../lib/config.mjs";
import { saveSession } from "../../lib/store.mjs";
import { ask, formData } from "../../lib/twiml.mjs";

export default async (req) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");
  const business = await getConfig();
  const greeting = `Thanks for calling ${business.name}. How can I help you today?`;

  await saveSession(callSid, {
    from: form.get("From") || "",
    started_at: new Date().toISOString(),
    slots: emptySlots(),
    history: [{ role: "assistant", content: greeting }],
  });

  return ask(greeting);
};

export const config = { path: "/voice" };
