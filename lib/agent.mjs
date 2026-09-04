const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export const businessName = () => process.env.BUSINESS_NAME || "our office";

async function groqJSON(messages) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

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
- Once you have all three answers, read the appointment back, say goodbye, and set done to true.
- If the caller does not want an appointment, answer briefly, say goodbye, and set done to true.

Respond only as JSON: {"reply": "what you say next", "done": true or false}`;

export async function nextTurn(history) {
  const out = await groqJSON([
    { role: "system", content: conversationPrompt() },
    ...history,
  ]);
  return { reply: String(out.reply || "Sorry, could you repeat that?"), done: !!out.done };
}

export async function extractOutcome(history) {
  const transcript = history
    .map((m) => `${m.role === "user" ? "Caller" : "Agent"}: ${m.content}`)
    .join("\n");

  return groqJSON([
    {
      role: "system",
      content: `Extract the outcome of this phone call as JSON with exactly these keys:
{"caller_name": string, "service": string, "appointment": string, "summary": string, "booked": true or false}

"appointment" is the day and time in plain English, or "" if none was agreed.
"summary" is two sentences describing what happened on the call.
Use "" for anything the caller did not provide. Do not invent details.`,
    },
    { role: "user", content: transcript || "(no conversation)" },
  ]);
}
