import { listCalls } from "../../lib/store.mjs";
import { getConfig } from "../../lib/config.mjs";

// Times are written as floating local time (no Z, no TZID): the spa is one location,
// and "two in the afternoon" means two in the afternoon there. Adding a UTC offset
// would shift every appointment for anyone whose phone is in another timezone.
const stamp = (d) =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n) => String(n).padStart(2, "0")).join("") +
  "T" +
  [d.getHours(), d.getMinutes(), 0].map((n) => String(n).padStart(2, "0")).join("");

const utcStamp = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

// RFC 5545: escape these, and fold lines over 75 octets.
const esc = (s) =>
  String(s || "").replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => "\\" + c).replace(/\r?\n/g, "\\n");

const fold = (line) => {
  const out = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
};

export default async () => {
  const [calls, business] = await Promise.all([listCalls(), getConfig()]);

  const events = calls.flatMap((call) => {
    const start = call.appointment_iso ? new Date(call.appointment_iso) : null;
    if (!start || Number.isNaN(start.getTime())) return [];

    const end = new Date(start.getTime() + (Number(call.duration_minutes) || 60) * 60000);
    const who = call.caller_name || "Unknown caller";
    const description = [
      `Caller: ${who}`,
      `Phone: ${call.callback || call.from || "not provided"}`,
      `Asked for: ${call.appointment || "not provided"}`,
      `Service: ${call.service || "not provided"}`,
      "",
      call.summary || "",
      "",
      "Taken by the phone agent. Not confirmed with the client.",
    ].join("\n");

    return [
      [
        "BEGIN:VEVENT",
        `UID:${call.id}@voice-agent-start`,
        `DTSTAMP:${utcStamp(new Date(call.ended_at || Date.now()))}`,
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(end)}`,
        fold(`SUMMARY:${esc(`${who} — ${call.service || "massage"}`)}`),
        fold(`DESCRIPTION:${esc(description)}`),
        // Requests are not confirmed bookings, so they land as tentative.
        "STATUS:TENTATIVE",
        "END:VEVENT",
      ].join("\r\n"),
    ];
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//voice-agent-start//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${esc(business.name)} — Requests`),
    "X-PUBLISHED-TTL:PT5M",
    "REFRESH-INTERVAL;VALUE=DURATION:PT5M",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics + "\r\n", {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

export const config = { path: "/calendar.ics" };
