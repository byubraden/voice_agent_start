import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

import { businessName } from "../lib/agent.mjs";

test("defaults the demo business to Miester's Massage Spa", () => {
  delete process.env.BUSINESS_NAME;

  assert.equal(businessName(), "Miester's Massage Spa");
});

test("call log page uses massage demo branding", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

  assert.match(html, /Miester's Massage Spa/);
  assert.match(html, /massage appointments/i);
});
