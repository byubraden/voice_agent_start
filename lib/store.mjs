import { getStore } from "@netlify/blobs";

const sessions = () => getStore("sessions");
const calls = () => getStore("calls");

export async function loadSession(callSid) {
  // Strong consistency is not the default. Without it a turn can read a session
  // that is missing the previous exchange, and the agent repeats itself.
  const stored = await sessions().get(callSid, { type: "json", consistency: "strong" });
  return stored || { history: [], from: "" };
}

export async function saveSession(callSid, session) {
  await sessions().setJSON(callSid, session);
}

export async function finalizeCall(callSid, record) {
  await calls().setJSON(callSid, record);
  await sessions().delete(callSid);
}

export async function isFinalized(callSid) {
  return (await calls().get(callSid)) !== null;
}

// Wipes every saved call and any in-flight session. Irreversible — there is no
// second copy of a transcript anywhere.
export async function clearAll() {
  let removed = 0;
  for (const store of [calls(), sessions()]) {
    const { blobs } = await store.list();
    await Promise.all(blobs.map(({ key }) => store.delete(key)));
    removed += blobs.length;
  }
  return removed;
}

export async function listCalls() {
  const { blobs } = await calls().list();
  const records = await Promise.all(
    blobs.map(({ key }) => calls().get(key, { type: "json" }))
  );
  return records.filter(Boolean).sort((a, b) => b.ended_at.localeCompare(a.ended_at));
}
