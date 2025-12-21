import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function parseDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL");
  return { mimeType: m[1], data: m[2] };
}

function extractJson(text: string) {
  const t = (text || "")
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("No JSON object found");
  return JSON.parse(t.slice(first, last + 1));
}

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return extractJson(text);
  }
}

const systemText = `You are an educational AI assistant about hair/scalp health.
- Non-diagnostic only, use hedging language ("may", "could", "appears to")
- Encourage consulting a board-certified dermatologist
- Output MUST be ONLY JSON (no markdown, no extra text)
- Keep it concise`;

const responseSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    confidence: { type: "number" },
    summary: { type: "string" },
    observations: { type: "array", items: { type: "string" } },
    likely_patterns: { type: "array", items: { type: "string" } },
    general_options: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["title", "bullets"],
      },
    },
    when_to_see_a_dermatologist: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
  },
  required: [
    "score",
    "confidence",
    "summary",
    "observations",
    "likely_patterns",
    "general_options",
    "when_to_see_a_dermatologist",
    "disclaimer",
  ],
};

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

    // ONLY first photo for demo stability
    const { mimeType, data } = parseDataUrl(photos[0]);

    const questionnaire = `User Information:
- Age Range: ${answers?.ageRange || "Not provided"}
- Noticing changes for: ${answers?.timeframe || "Not provided"}
- Family history of hair loss: ${answers?.familyHistory || "Not provided"}
- Daily shedding level: ${answers?.shedding || "Not provided"}
- Scalp conditions: ${answers?.scalpIssues || "Not provided"}

Return ONLY JSON matching the schema. Keep it short.`;

    const body = {
      // IMPORTANT: correct REST field name (camelCase)
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: mimeType, data } },
            { text: questionnaire },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
        responseMimeType: "application/json",
        // IMPORTANT: use responseSchema (REST-supported and reliable)
        responseSchema,
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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      const parsed = safeParse(text);
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: "Invalid JSON from model",
        finishReason,
        rawHead: text.slice(0, 300),
        rawTail: text.slice(-300),
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
