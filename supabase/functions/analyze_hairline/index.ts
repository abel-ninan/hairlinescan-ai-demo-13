import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const systemPrompt = `
You are an educational AI assistant that provides general information about hair and scalp health.

CRITICAL GUIDELINES:
- You are NOT a medical professional and CANNOT diagnose any condition.
- All observations are NON-DIAGNOSTIC and purely educational.
- You MUST express uncertainty and use hedging language like "may", "could", "appears to", "might suggest".
- You MUST encourage users to consult a board-certified dermatologist for any concerns.
- Do NOT claim to identify specific medical conditions with certainty.
- Focus on general patterns that are commonly discussed in educational contexts.
- Be supportive and non-alarmist in tone.

Return ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "score": <number 0-10 representing general hair health estimate, with 0 being excellent and 10 being significant concerns>,
  "confidence": <number 0-1 representing how confident you are in your observations>,
  "summary": "<1-2 sentence summary of general observations>",
  "observations": ["<observation 1>", "<observation 2>", ...],
  "likely_patterns": ["<pattern 1 that may be present>", ...],
  "general_options": [
    {"title": "<option category>", "bullets": ["<bullet 1>", "<bullet 2>"]}
  ],
  "when_to_see_a_dermatologist": ["<reason 1>", "<reason 2>", ...],
  "disclaimer": "This analysis is for educational purposes only and is not medical advice. The observations made are non-diagnostic estimates based on limited photo analysis. Hair and scalp conditions require professional evaluation. Please consult a board-certified dermatologist for accurate diagnosis and personalized treatment recommendations."
}
`.trim();

function parseDataUrl(dataUrl: string): { mime: string; b64: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL (expected base64 data URL)");
  return { mime: m[1], b64: m[2] };
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 25000,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // keep raw text
    }
    return { res, text, json };
  } finally {
    clearTimeout(id);
  }
}

function cleanMaybeFenced(text: string) {
  let t = (text || "").trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return t;
}

function extractJsonObject(text: string) {
  const t = cleanMaybeFenced(text);
  try {
    return JSON.parse(t);
  } catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model did not return JSON");
    return JSON.parse(m[0]);
  }
}

function buildQuestionnaireContext(answers: any) {
  return `
User Information:
- Age Range: ${answers?.ageRange ?? "Not provided"}
- Noticing changes for: ${answers?.timeframe ?? "Not provided"}
- Family history of hair loss: ${answers?.familyHistory ?? "Not provided"}
- Daily shedding level: ${answers?.shedding ?? "Not provided"}
- Scalp conditions: ${answers?.scalpIssues ?? "Not provided"}

Analyze the provided photos of the hairline/scalp area and provide educational observations.
`.trim();
}

async function callGemini({
  apiKey,
  model,
  systemInstructionVariant,
  generationConfigVariant,
  parts,
}: {
  apiKey: string;
  model: string;
  systemInstructionVariant: "camel" | "snake";
  generationConfigVariant: "camel" | "snake";
  parts: any[];
}) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Variants because Gemini docs show mixed casing across examples.
  const systemBlock =
    systemInstructionVariant === "camel"
      ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
      : { system_instruction: { parts: [{ text: systemPrompt }] } };

  const genConfig =
    generationConfigVariant === "camel"
      ? { generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1200 } }
      : { generation_config: { response_mime_type: "application/json", temperature: 0.2, max_output_tokens: 1200 } };

  const body = {
    ...systemBlock,
    ...genConfig,
    contents: [{ role: "user", parts }],
  };

  const { res, text, json } = await fetchJsonWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
    25000,
  );

  if (!res.ok) return { ok: false as const, status: res.status, text, json };

  // Gemini responses typically place text in candidates[0].content.parts[].text
  const candidateParts = json?.candidates?.[0]?.content?.parts ?? [];
  const outText = candidateParts.map((p: any) => p?.text ?? "").join("").trim();

  return { ok: true as const, status: res.status, outText, raw: json };
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

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Keep payload smaller: use at most 2 photos on backend
    const usePhotos = photos.slice(0, 2);

    // Quick payload safety
    const totalChars = usePhotos.reduce((sum: number, p: string) => sum + (p?.length ?? 0), 0);
    if (totalChars > 1_800_000) {
      return new Response(JSON.stringify({ error: "Payload too large. Retake with compression or fewer photos." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const questionnaire = buildQuestionnaireContext(answers);

    const parts: any[] = [{ text: questionnaire }];

    for (const p of usePhotos) {
      const { mime, b64 } = parseDataUrl(p);
      parts.push({
        inline_data: {
          mime_type: mime,
          data: b64,
        },
      });
    }

    parts.push({
      text:
        "Return ONLY the JSON object that matches the schema exactly. No markdown, no commentary.",
    });

    // Try model + casing variants for maximum compatibility
    const modelCandidates = ["gemini-2.5-pro", "gemini-2.5-flash"];

    const attempts: Array<[string, "camel" | "snake", "camel" | "snake"]> = [];
    for (const m of modelCandidates) {
      attempts.push([m, "camel", "camel"]);
      attempts.push([m, "snake", "camel"]);
      attempts.push([m, "camel", "snake"]);
      attempts.push([m, "snake", "snake"]);
    }

    let lastErr: any = null;

    for (const [model, sysVar, genVar] of attempts) {
      const r = await callGemini({
        apiKey,
        model,
        systemInstructionVariant: sysVar,
        generationConfigVariant: genVar,
        parts,
      });

      if (!r.ok) {
        lastErr = r;

        // Rate limit: immediately bubble up
        if (r.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Try next variant/model
        continue;
      }

      // Parse JSON result
      let parsed: any;
      try {
        parsed = extractJsonObject(r.outText);
      } catch (e) {
        lastErr = { status: 500, text: r.outText, parseError: String(e) };
        continue;
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("Gemini failed:", lastErr);
    return new Response(JSON.stringify({ error: "AI analysis failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze_hairline error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
