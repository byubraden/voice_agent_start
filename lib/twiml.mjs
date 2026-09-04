const escape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );

const VOICE = 'voice="Polly.Matthew-Neural"';

export function xml(body) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

// actionOnEmptyResult keeps silence in the conversation: the agent gets an empty turn
// and can say "are you still there?" instead of Twilio hanging up on the caller.
export const ask = (text) =>
  xml(
    `<Gather input="speech" speechTimeout="auto" timeout="6" actionOnEmptyResult="true" ` +
      `language="en-US" action="/turn" method="POST">` +
      `<Say ${VOICE}>${escape(text)}</Say>` +
      `</Gather>` +
      `<Say ${VOICE}>Sorry, I could not hear you. Goodbye.</Say><Hangup/>`
  );

export const sayAndHangUp = (text) => xml(`<Say ${VOICE}>${escape(text)}</Say><Hangup/>`);

export async function formData(req) {
  return new URLSearchParams(await req.text());
}
