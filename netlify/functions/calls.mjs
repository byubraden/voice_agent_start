import { listCalls } from "../../lib/store.mjs";

export default async () =>
  Response.json(await listCalls(), {
    headers: { "cache-control": "no-store" },
  });

export const config = { path: "/api/calls" };
