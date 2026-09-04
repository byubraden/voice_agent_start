import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

const page = () => readFile(new URL("../public/index.html", import.meta.url), "utf8");

test("dashboard has a schedule tab with a week grid", async () => {
  const html = await page();

  assert.match(html, /id="tabSchedule"/);
  assert.match(html, /id="viewSchedule"/);
  assert.match(html, /id="calGrid"/);
  assert.match(html, /appointment_iso/);
});

test("hidden sections actually hide", async () => {
  const html = await page();

  // .grid and .panel set an explicit display, which outranks the browser's default
  // [hidden] rule — without this the inactive tab renders on top of the active one.
  assert.match(html, /\[hidden\]\s*{\s*display:\s*none\s*!important/);
});

test("requests with no resolvable time are surfaced, not dropped", async () => {
  const html = await page();

  assert.match(html, /id="calUnscheduled"/);
  assert.match(html, /Needs a real time/i);
});

test("calendar can be subscribed to, not just exported once", async () => {
  const html = await page();

  assert.match(html, /calendar\.ics/);
  // webcal:// makes Google treat it as a live subscription instead of a one-time
  // import, which is the whole point — later calls have to keep flowing in.
  assert.match(html, /webcal:/);
});

test("clicking an event opens a closable detail modal", async () => {
  const html = await page();

  assert.match(html, /function openEvent/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Close"/);
  assert.match(html, /Escape/);
});
