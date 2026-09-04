const URL = "https://api.groq.com/openai/v1/chat/completions";

// Replies the caller is waiting on. The 20b model is quicker but loses track of what
// it has already asked; 120b benchmarked at ~750ms, which is fine on a call.
export const TURN_MODEL = "openai/gpt-oss-120b";
// Slower but sharper, for the summary written after the caller has hung up.
export const EXTRACT_MODEL = "openai/gpt-oss-120b";

// These models occasionally put everything in the reasoning field and return empty
// content, or wrap the object in a code fence. Pull out the JSON either way.
function parseLoose(raw) {
  const text = String(raw || "").trim();
  if (!text) throw new Error("empty content");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error(`no JSON object in: ${text.slice(0, 120)}`);
  return JSON.parse(text.slice(start, end + 1));
}

export async function chatJSON(messages, { model = TURN_MODEL, attempts = 3 } = {}) {
  let lastError;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          reasoning_effort: "low",
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) throw new Error(`groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return parseLoose((await res.json()).choices?.[0]?.message?.content);
    } catch (err) {
      lastError = err;
      console.warn(`groq attempt ${i + 1}/${attempts} failed: ${err.message}`);
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }

  throw lastError;
}
