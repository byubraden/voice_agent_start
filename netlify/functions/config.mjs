import { getConfig, setConfig } from "../../lib/config.mjs";

// Anyone who can reach this URL can change what the agent says to real callers,
// so writes require the password in ADMIN_PASSWORD. Reads are open.
export default async (req) => {
  if (req.method === "GET") {
    return Response.json(await getConfig(), { headers: { "cache-control": "no-store" } });
  }

  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return Response.json({ error: "Set ADMIN_PASSWORD in Netlify to enable editing." }, { status: 503 });
  }
  if (req.headers.get("x-admin-password") !== expected) {
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  return Response.json(await setConfig(body));
};

export const config = { path: "/api/config" };
