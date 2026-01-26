import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS - add your production domain here
const ALLOWED_ORIGINS = [
  "capacitor://localhost",      // iOS app
  "http://localhost",           // iOS app fallback
  "http://localhost:5173",      // Local dev server
  "http://localhost:8100",      // Capacitor dev
  // Add your production domain when deployed:
  // "https://yourdomain.com",
];

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;        // Max requests per window
const RATE_LIMIT_WINDOW = 60000;  // 1 minute window

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count++;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.startsWith(allowed)
  ) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

const MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function parseDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL");
  return { mimeType: m[1], data: m[2] };
}

function safeJsonParse(text: string) {
  const t = (text || "")
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try { return JSON.parse(t); } catch {
    // Fallback: try to find JSON object in text
  }

  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("No JSON object found");
  return JSON.parse(t.slice(first, last + 1));
}

const systemText = `
You are an educational assistant about hair/scalp appearance.
Non-diagnostic only. Use hedging language ("may", "could", "appears to").
Return ONLY JSON. No markdown. No extra text.
Keep it SHORT.
`.trim();

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client identifier for rate limiting (use IP or fallback)
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";

  // Check rate limit
  if (isRateLimited(clientIP)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const { photos, answers } = await req.json();

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "At least one photo is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate photo data format
    if (!photos[0] || typeof photos[0] !== "string" || !photos[0].startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid photo format" }), {
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

    // ONE photo only
    const { mimeType, data } = parseDataUrl(photos[0]);

    const userText =
      `Return ONLY ONE LINE of MINIFIED JSON. No markdown. No extra text.
Keys must be EXACTLY: score, confidence, summary, tags, hairline_type, hairline_description, personalized_tips
Rules:
- score: 0-10 number (0=severe loss, 10=no loss)
- confidence: 0-1 number
- summary: <= 120 chars
- tags: array of 1-3 very short strings
- hairline_type: specific type e.g. "Widow's Peak", "Mature Hairline", "Receding Temples", "M-shaped", "Straight", "Rounded"
- hairline_description: 1 sentence explaining what this hairline type means
- personalized_tips: array of 3 specific tips for THIS hairline type, not generic advice
STOP AFTER THE FINAL }.

AgeRange:${answers?.ageRange || "NA"} Timeframe:${answers?.timeframe || "NA"} Family:${answers?.familyHistory || "NA"} Shedding:${answers?.shedding || "NA"} Scalp:${answers?.scalpIssues || "NA"}`;

    // IMPORTANT: no responseSchema/responseJsonSchema at all (prevents 400s)
    const body = {
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: mimeType, data } },
            { text: userText },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
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
      const detail = await resp.text().catch(() => "");
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "30" },
        });
      }
      return new Response(JSON.stringify({ error: "Gemini request failed", status: resp.status, detail: detail.slice(0, 1200) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out = await resp.json();
    const finishReason = out?.candidates?.[0]?.finishReason;

    const text =
      out?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text ?? "").join("").trim();

    if (!text) {
      return new Response(JSON.stringify({ error: "No content from model", finishReason }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (finishReason === "MAX_TOKENS") {
      return new Response(JSON.stringify({ error: "Model output truncated (MAX_TOKENS). Try again.", finishReason }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mini = safeJsonParse(text);

    // Expand to your full UI schema (simple, stable)
    const score = Math.max(0, Math.min(10, Number(mini.score ?? 5)));
    const confidence = Math.max(0, Math.min(1, Number(mini.confidence ?? 0.5)));
    const summary = String(mini.summary ?? "Educational estimate based on the photo provided.").slice(0, 260);
    const tags = Array.isArray(mini.tags) ? mini.tags.map(String).slice(0, 3) : [];
    const hairlineType = mini.hairline_type ? String(mini.hairline_type) : undefined;
    const hairlineDescription = mini.hairline_description ? String(mini.hairline_description) : undefined;
    const personalizedTips = Array.isArray(mini.personalized_tips)
      ? mini.personalized_tips.map(String).slice(0, 5)
      : undefined;

    const result = {
      score,
      confidence,
      summary,
      observations: [
        ...(tags.map((t: string) => `Photo may suggest: ${t}.`)),
        "Lighting/angle can affect how dense the hair appears in photos.",
      ].slice(0, 4),
      likely_patterns: tags.length ? tags : ["Temple recession may be present", "Hairline density may vary with lighting"],
      general_options: [
        { title: "Basics", bullets: ["Consistent monthly photos (same lighting/angle).", "Sleep, protein, stress management.", "Avoid traction/harsh styling if relevant."] },
        { title: "Common options (educational)", bullets: ["Topical minoxidil is commonly discussed.", "Ketoconazole shampoo is used by some for scalp health.", "Microneedling is discussed by some users (be cautious)."] },
        { title: "When to escalate", bullets: ["Rapid changes or irritation.", "If you want diagnosis/personal plan.", "Bring your photo timeline to a dermatologist."] },
      ],
      when_to_see_a_dermatologist: [
        "Sudden or rapidly worsening shedding over weeks.",
        "Patchy loss, pain, redness, significant flaking/itch.",
        "Any concern where you want diagnosis/treatment guidance.",
      ],
      disclaimer:
        "Educational only — not medical advice or a diagnosis. Photo-based observations are limited. Consult a board-certified dermatologist for concerns.",
      hairline_type: hairlineType,
      hairline_description: hairlineDescription,
      personalized_tips: personalizedTips,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
