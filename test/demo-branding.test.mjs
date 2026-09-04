import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

import { defaults } from "../lib/config.mjs";

test("a fresh deploy starts as the massage demo", () => {
  delete process.env.BUSINESS_NAME;
  delete process.env.BUSINESS_INFO;

  assert.equal(defaults().name, "Miester's Massage Spa");
  assert.match(defaults().info, /deep tissue/i);
  // The agent must never invent a price, so the seeded info has to carry real ones.
  assert.match(defaults().info, /\$\d+/);
  assert.match(defaults().info, /cancellation/i);
});

test("business details are editable, not hardcoded in the page", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

  // The heading is filled in from /api/config at runtime, so the spa name must not be
  // baked into the markup — otherwise editing it in the settings panel changes the
  // agent but leaves the page still advertising the old business.
  assert.doesNotMatch(html, /Miester's Massage Spa/);
  assert.match(html, /api\/config/);
  assert.match(html, /id="binfo"/);
});
