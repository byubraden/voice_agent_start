import { loadSession } from "../../lib/store.mjs";
import { finalize } from "../../lib/finalize.mjs";
import { formData } from "../../lib/twiml.mjs";

// Backup path: catches calls where the caller hung up before the agent finished.
// A normal goodbye is already saved by /turn, and finalize() ignores duplicates.
export default async (req) => {
  const form = await formData(req);
  const callSid = form.get("CallSid");

  if (form.get("CallStatus") !== "completed") return new Response("ok");

  const session = await loadSession(callSid);
  await finalize(callSid, session, {
    duration: form.get("CallDuration"),
    from: form.get("From") || "",
  });

  return new Response("ok");
};

export const config = { path: "/status" };
