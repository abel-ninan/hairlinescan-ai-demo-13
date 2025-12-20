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
  const t = (text || "").trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("No JSON object found");
  return JSON.parse(t.slice(first, last + 1));
}

const systemInstruction = `You are an educational AI assistant that provides general information about hair and scalp health.

CRITICAL GUIDELINES:
- You are NOT a medical professional and CANNOT diagnose any condition
- All observations are NON-DIAGNOSTIC and purely educational
- Use hedging language like "may", "could", "appears to", "might suggest"
- Encourage consulting a board-certified dermatologist for concerns
- Do NOT claim to identify medical conditions with certainty
- Be supportive and non-alarmist

OUTPUT RULES (IMPORTANT):
- Return ONLY a single JSON object (no markdown)
- Keep it SHORT:
  - observations: max 4 items
  - likely_patterns: max 3 items
  - general_options: exactly 3 items, bullets max 3 each
  - when_to_see_a_dermatologist: max 3 items
`;

const responseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "number", minimum: 0, maximum: 10 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    summary: { type: "string" },
    observations: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
    likely_patterns: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
    },
    general_options: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          bullets: {
            type: "array",
            minItems: 2,
            maxItems: 3,
            items: { type: "string" },
          },
        },
        required: ["title", "bullets"],
      },
    },
    when_to_see_a_dermatologist: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string" },
    },
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Only first photo for demo stability
    const { mimeType, data } = parseDataUrl(photos[0]);

    const questionnaire = `User Information:
- Age Range: ${answers?.ageRange || "Not provided"}
- Noticing changes for: ${answers?.timeframe || "Not provided"}
- Family history of hair loss: ${answers?.familyHistory || "Not provided"}
- Daily shedding level: ${answers?.shedding || "Not provided"}
- Scalp conditions: ${answers?.scalpIssues || "Not provided"}

Task:
Analyze the photo of the hairline/scalp area and provide educational, non-diagnostic observations and general options.
Return ONLY JSON.`;

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data } },
            { text: questionnaire },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 900,
        responseMimeType: "application/json",
        responseJsonSchema: responseJsonSchema,
      },
    };

    const resp = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
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
      return new Response(JSON.stringify({ error: "AI analysis failed", detail: txt.slice(0, 500) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out = await resp.json();

    const text =
      out?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("")?.trim();

    if (!text) {
      return new Response(JSON.stringify({ error: "No analysis generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const parsed = extractJson(text);
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON from model", raw: text.slice(0, 500) }), {
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
