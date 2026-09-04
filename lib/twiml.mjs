const escape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );

const VOICE = 'voice="Polly.Joanna"';

export function xml(body) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

export const ask = (text) =>
  xml(
    `<Gather input="speech" speechTimeout="auto" action="/turn" method="POST">` +
      `<Say ${VOICE}>${escape(text)}</Say>` +
      `</Gather>` +
      `<Say ${VOICE}>I did not catch that. Goodbye.</Say><Hangup/>`
  );

export const sayAndHangUp = (text) => xml(`<Say ${VOICE}>${escape(text)}</Say><Hangup/>`);

export async function formData(req) {
  return new URLSearchParams(await req.text());
}
