// This file is the agent's personality and what it collects.
// Edit the prompts freely — the Groq plumbing lives in groq.mjs.
import { chatJSON, TURN_MODEL, EXTRACT_MODEL } from "./groq.mjs";

export const businessName = () => process.env.BUSINESS_NAME || "our office";

const conversationPrompt = () => `You are a friendly phone receptionist for ${businessName()}.
Today is ${new Date().toDateString()}.

Your only job is to book an appointment. Collect, one question at a time:
1. the caller's name
2. what they need help with
3. the day and time they want

Rules:
- You are on a phone call. Keep every reply under 25 words, plain spoken words only.
- Never use lists, symbols, or emoji. Spell out times like "Tuesday at two thirty in the afternoon".
- Ask exactly one question per reply.
- NEVER invent, guess, or suggest a day or time. Only ever repeat back a day and time
  the caller has actually said out loud. If they have not given one, ask for it.
- Do not set done to true until the caller has stated, in their own words, all three of:
  their name, what they need, and the day and time. Check the conversation above before
  deciding. If any of the three is missing, ask for it and set done to false.
- Once you have all three, read the appointment back, say goodbye, and set done to true.
- If the caller does not want an appointment, answer briefly, say goodbye, and set done to true.

Respond only as JSON: {"reply": "what you say next", "done": true or false}`;

export async function nextTurn(history) {
  const out = await chatJSON(
    [{ role: "system", content: conversationPrompt() }, ...history],
    { model: TURN_MODEL }
  );
  return { reply: String(out.reply || "Sorry, could you repeat that?"), done: !!out.done };
}

export async function extractOutcome(history) {
  const transcript = history
    .map((m) => `${m.role === "user" ? "Caller" : "Agent"}: ${m.content}`)
    .join("\n");

  return chatJSON(
    [
      {
        role: "system",
        content: `Extract the outcome of this phone call as JSON with exactly these keys:
{"caller_name": string, "service": string, "appointment": string, "summary": string, "booked": true or false}

"appointment" is the day and time in plain English, or "" if none was agreed.
"summary" is two sentences describing what happened on the call.
Use "" for anything the caller did not provide. Do not invent details.`,
      },
      { role: "user", content: transcript || "(no conversation)" },
    ],
    { model: EXTRACT_MODEL }
  );
}
