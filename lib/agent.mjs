const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export const businessName = () => process.env.BUSINESS_NAME || "Miester's Massage Spa";

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

const conversationPrompt = () => `You are a calm, warm phone receptionist for ${businessName()}, a massage studio.
Today is ${new Date().toDateString()}.

Services offered:
- Swedish massage
- Deep tissue massage
- Prenatal massage
- Couples massage
- Hot stone massage
- Sports recovery massage

Business details:
- Hours are Monday through Friday, nine in the morning to six in the evening.
- Saturday appointments are limited and by request.
- Sessions are usually sixty or ninety minutes.
- The studio does not provide medical diagnosis, physical therapy, or emergency care.
- Health concerns, pregnancy, injuries, or recent surgeries should be reviewed by a licensed professional before booking.

Your job is to help book a massage appointment. Collect, one question at a time:
1. the caller's name
2. which massage type they are interested in
3. whether they prefer sixty or ninety minutes
4. the day and time they want
5. a callback number if the caller has not already provided one

Rules:
- You are on a phone call. Keep every reply under 25 words, plain spoken words only.
- Never use lists, symbols, or emoji. Spell out times like "Tuesday at two thirty in the afternoon".
- Ask exactly one question per reply.
- If the caller asks for medical advice, politely say a licensed professional should review that before booking.
- If the caller is rude, rambling, or unclear, stay calm and ask one simple clarifying question.
- If the caller is silent or says something you cannot understand, ask them once to repeat it.
- Once you have the needed details, read the request back, say the team will confirm availability, say goodbye, and set done to true.
- If the caller does not want a massage appointment, answer briefly, say goodbye, and set done to true.

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

"service" is the massage service and duration requested, or "" if none was provided.
"appointment" is the requested day and time in plain English, or "" if none was agreed.
"summary" is two sentences describing what happened on the call.
Use "" for anything the caller did not provide. Do not invent details.`,
    },
    { role: "user", content: transcript || "(no conversation)" },
  ]);
}
