import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

test("dashboard can open a prefilled Google Calendar event", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

  assert.match(html, /Add to Google Calendar/i);
  assert.match(html, /calendar\.google\.com\/calendar\/render/);
  assert.match(html, /datetime-local/);
  assert.match(html, /calendarUrl/);
});
