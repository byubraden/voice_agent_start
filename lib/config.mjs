import { getStore } from "@netlify/blobs";

const store = () => getStore("config");
const KEY = "business";

// Seed content for the demo. Editing the settings panel on the site overrides all of it,
// so this is only what a brand new deploy starts with.
const DEMO_INFO = `Miester's Massage Spa.
Services: Swedish, deep tissue, prenatal, couples, hot stone, and sports recovery massage.
Sessions are sixty or ninety minutes.
Hours are Monday through Friday, nine in the morning to six in the evening.
Saturday appointments are limited and by request. Closed Sunday.
The studio does not provide medical diagnosis, physical therapy, or emergency care.
Clients with health concerns, pregnancy, injuries, or recent surgery should have a licensed
professional review it before booking.`;

export const defaults = () => ({
  name: process.env.BUSINESS_NAME || "Miester's Massage Spa",
  info: process.env.BUSINESS_INFO || DEMO_INFO,
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
