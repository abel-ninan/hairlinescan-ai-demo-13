import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "gemini-2.5-flash"; // vision-capable + within your free tier
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function parseDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL");
  return { mimeType: m[1], data: m[2] };
}

const systemInstruction = `You are an educational AI assistant that provides general information about hair and scalp health.

CRITICAL GUIDELINES:

- All observations are purely educational
- Use hedging language like "may", "could", "appears to", "might suggest"
- Encourage consulting a board-certified dermatologist for concerns
- Do NOT claim to identify medical conditions with certainty
- Be supportive and non-alarmist

Return ONLY valid JSON matching the required schema.`;

const responseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "number", minimum: 0, maximum: 10 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    summary: { type: "string" },
    observations: { type: "array", items: { type: "string" } },
    likely_patterns: { type: "array", items: { type: "string" } },
    general_options: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
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

    // Use ONLY the first photo for the AI call (keeps free-tier usage stable)
    const { mimeType, data } = parseDataUrl(photos[0]);

    const questionnaire = `User Information:
- Age Range: ${answers?.ageRange || "Not provided"}
- Noticing changes for: ${answers?.timeframe || "Not provided"}
- Family history of hair loss: ${answers?.familyHistory || "Not provided"}
- Daily shedding level: ${answers?.shedding || "Not provided"}
- Scalp conditions: ${answers?.scalpIssues || "Not provided"}

Task:
Analyze the photo of the hairline/scalp area and provide educational, non-diagnostic observations and general options.`;

    const body = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data,
              },
            },
            { text: questionnaire },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: "application/json",
        responseJsonSchema,
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

    // Gemini response text is in candidates[0].content.parts[0].text
    const text =
      out?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("")?.trim();

    if (!text) {
      return new Response(JSON.stringify({ error: "No analysis generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON from the model output
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON from model", raw: text.slice(0, 300) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze_hairline error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
