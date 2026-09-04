import { getStore } from "@netlify/blobs";

const store = () => getStore("config");
const KEY = "business";

const defaults = () => ({
  name: process.env.BUSINESS_NAME || "our office",
  info: process.env.BUSINESS_INFO || "No details about this business have been added yet.",
});

export async function getConfig() {
  const saved = await store().get(KEY, { type: "json", consistency: "strong" });
  return { ...defaults(), ...(saved || {}) };
}

export async function setConfig({ name, info }) {
  const next = {
    name: String(name || "").trim().slice(0, 100) || defaults().name,
    info: String(info || "").trim().slice(0, 4000),
    updated_at: new Date().toISOString(),
  };
  await store().setJSON(KEY, next);
  return next;
}
