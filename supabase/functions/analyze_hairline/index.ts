import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Use a smaller, more stable JSON output to avoid MAX_TOKENS loops.
// (We'll generate the rest of the UI fields server-side.)
const MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function parseDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL (expected base64 data URL)");
  return { mimeType: m[1], data: m[2] };
}

function safeJsonParse(text: string) {
  const t = (text || "")
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  // try direct
  try { return JSON.parse(t); } catch {}

  // try extracting first {...}
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("No JSON object found");
  return JSON.parse(t.slice(first, last + 1));
}

const systemText = `
You are an educational assistant about hair/scalp appearance.
Non-diagnostic only. Use hedging language ("may", "could", "appears to").
Return ONLY JSON. No markdown. Keep it VERY short.
`.trim();

// Minimal schema to prevent the model from rambling/truncating.
// We will expand this into the full app schema in the edge function response.
const miniResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "number" },
    confidence: { type: "number" },
    summary: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["score", "confidence", "summary", "tags"],
};

// Expand model output into your full UI schema
function buildFullResult(mini: any, answers: any) {
  const score = Math.max(0, Math.min(10, Number(mini.score ?? 5)));
  const confidence = Math.max(0, Math.min(1, Number(mini.confidence ?? 0.5)));
  const summary = String(mini.summary ?? "Educational estimate based on the photo provided.").slice(0, 260);

  const tags: string[] = Array.isArray(mini.tags) ? mini.tags.map(String).slice(0, 4) : [];
  const observations: string[] = [
    ...tags.map(t => `Photo may suggest: ${t}.`),
  ];

  // Light personalization from questionnaire (no medical claims)
  if (answers?.familyHistory && String(answers.familyHistory).toLowerCase().includes("yes")) {
    observations.push("Family history may increase the likelihood of pattern changes over time.");
  }
  if (answers?.timeframe) {
    observations.push(`You reported noticing changes over: ${answers.timeframe}.`);
  }
  while (observations.length < 3) observations.push("Lighting/angle can affect how dense the hair appears in photos.");

  const likely_patterns = tags.length ? tags : ["Temple recession may be present", "Hairline density may vary with lighting"];

  const general_options = [
    {
      title: "Low-effort basics",
      bullets: [
        "Take consistent photos monthly (same lighting/angle).",
        "Prioritize sleep, protein, and stress management.",
        "Avoid harsh traction (tight hats/styles) if applicable.",
      ],
    },
    {
      title: "Common OTC options (educational)",
      bullets: [
        "Topical minoxidil is commonly discussed for hair support.",
        "Ketoconazole shampoo is sometimes used for scalp health.",
        "Microneedling is discussed by some users (be cautious/hygienic).",
      ],
    },
    {
      title: "When to escalate",
      bullets: [
        "If rapid shedding or irritation occurs, consider seeing a dermatologist.",
        "If you want a personalized plan, a derm can evaluate causes.",
        "Bring your photo timeline + history to the appointment.",
      ],
    },
  ];

  const when_to_see_a_dermatologist = [
    "Sudden or rapidly worsening shedding over weeks.",
    "Patchy loss, scalp pain, redness, or significant flaking/itch.",
    "Any concern where you want diagnosis/treatment guidance.",
  ];

  const disclaimer =
    "Educational only — not medical advice or a diagnosis. Photo-based observations are limited. Consult a board-certified dermatologist for concerns.";

  return {
    score,
    confidence,
    summary,
    observations: observations.slice(0, 4),
    likely_patterns: likely_patterns.slice(0, 3),
    general_options,
    when_to_see_a_dermatologist,
    disclaimer,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { photos, answers } = await req.json();

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "At least one photo is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ONE photo only (demo + quota friendly)
    const { mimeType, data } = parseDataUrl(photos[0]);

    const userText = `
Return ONLY JSON matching this schema:
{
  "score": number (0-10),
  "confidence": number (0-1),
  "summary": string (<= 220 chars),
  "tags": string[] (1-4 short tags about what the photo may suggest)
}

User info:
- Age Range: ${answers?.ageRange || "Not provided"}
- Timeframe: ${answers?.timeframe || "Not provided"}
- Family history: ${answers?.familyHistory || "Not provided"}
- Shedding: ${answers?.shedding || "Not provided"}
- Scalp issues: ${answers?.scalpIssues || "Not provided"}
`.trim();

    const body = {
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: userText },
            { inline_data: { mime_type: mimeType, data } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
        responseSchema: miniResponseSchema,
      },
    };

    const resp = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "30" },
        });
      }
      return new Response(JSON.stringify({ error: "Gemini request failed", detail: txt.slice(0, 800) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out = await resp.json();
    const finishReason = out?.candidates?.[0]?.finishReason;

    const text =
      out?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim();

    if (!text) {
      return new Response(JSON.stringify({ error: "No content from model", finishReason }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const mini = safeJsonParse(text);
      const full = buildFullResult(mini, answers);
      return new Response(JSON.stringify(full), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: "Invalid JSON from model",
        finishReason,
        rawHead: text.slice(0, 300),
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
