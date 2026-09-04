# voice_agent_start

A phone number you can call, answered by an AI receptionist. It books an appointment,
then posts the appointment and a summary of the call to a web page.

## How it works

```
Caller → Twilio number → /voice  → greeting, starts listening
                       → /turn   → Twilio transcribes speech → Groq decides the reply → speaks it (repeat)
                       → /status → call ended → Groq extracts appointment + summary → saved
Web page  →  /api/calls → list of calls  →  index.html
```

Twilio's built-in `<Gather input="speech">` does the speech-to-text and `<Say>` does the
text-to-speech, so there is no separate STT/TTS service to pay for or host.

## Cost

| Piece | Cost |
| --- | --- |
| Groq (LLM) | Free tier |
| Netlify (hosting, functions, blob storage) | Free tier |
| Twilio phone number | ~$1.15/month |
| Twilio inbound calls | ~$0.0085/minute |

Twilio's free trial credit covers development. It is the only piece that is not free.

## Setup

### 1. Groq API key
Create a key at https://console.groq.com/keys (free, no card required).

### 2. Deploy to Netlify
Connect this repo at https://app.netlify.com → Add new site → Import an existing project.
No build command is needed. Then under **Site configuration → Environment variables** add:

- `GROQ_API_KEY` — your Groq key
- `BUSINESS_NAME` — e.g. `Ditto Plumbing`

Note the site URL, e.g. `https://your-site.netlify.app`.

### 3. Twilio number
Sign up at https://twilio.com/try-twilio, then **Phone Numbers → Buy a number**
(choose one with Voice capability). Open the number's settings and set:

- **A call comes in** → Webhook → `https://your-site.netlify.app/voice` → HTTP POST
- **Call status changes** → `https://your-site.netlify.app/status` → HTTP POST

The second one is what generates the summary, so it is not optional.

### 4. Call it
Dial the number, book an appointment, hang up. The result appears at
`https://your-site.netlify.app` within a few seconds.

## Local development

```bash
npm install
npx netlify dev
```

Twilio needs a public URL to reach your machine — `npx netlify dev --live` provides one,
and that URL goes in the Twilio settings above instead of the deployed site URL.

## Known gaps (deliberate, MVP scope)

- **No Twilio signature validation.** Anyone who knows the URLs can POST fake calls.
  Add `twilio.validateRequest` before this handles anything real.
- The call log page is public to anyone with the URL.
- Appointments are stored as plain text ("Tuesday at 2:30"), not parsed into a calendar.
