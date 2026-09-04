import { listCalls, clearAll } from "../../lib/store.mjs";

export default async (req) => {
  if (req.method === "DELETE") {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return Response.json({ error: "Set ADMIN_PASSWORD in Netlify to enable this." }, { status: 503 });
    }
    if (req.headers.get("x-admin-password") !== expected) {
      return Response.json({ error: "Wrong password." }, { status: 401 });
    }
    return Response.json({ removed: await clearAll() });
  }

  return Response.json(await listCalls(), { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/api/calls" };
