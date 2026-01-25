import { useState, useCallback, useRef, useEffect } from "react";
import { AnalysisResult } from "@/types/analysis";
import { CapturedPhotos } from "@/components/screens/CaptureScreen";
import { QuestionnaireData } from "@/components/Questionnaire";

const MAX_PAYLOAD_SIZE = 1.5 * 1024 * 1024; // 1.5MB
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];
const COOLDOWN_KEY = 'hairline_last_analyze_at';
const MIN_COOLDOWN_MS = 20000; // 20 seconds
const DEFAULT_RATE_LIMIT_WAIT = 15; // seconds

export type ErrorType = 'payload_too_large' | 'rate_limit' | 'server_error' | 'network_error' | 'cooldown';

interface UseAnalysisReturn {
  isAnalyzing: boolean;
  error: string | null;
  errorType: ErrorType | null;
  usedFallback: boolean;
  usedSinglePhoto: boolean;
  cooldownRemaining: number;
  rateLimitWait: number;
  analyze: (photos: CapturedPhotos, questionnaire: QuestionnaireData) => Promise<AnalysisResult | null>;
  retry: () => Promise<AnalysisResult | null>;
  clearError: () => void;
}

// Compress and resize a photo to reduce payload size
async function compressPhoto(dataUrl: string, maxWidth: number = 640, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

// Get byte size of a data URL
function getDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

// Generate fallback demo result - only used for 500/network errors
function generateFallbackResult(): AnalysisResult {
  const score = 2 + Math.random() * 5;
  return {
    score: Math.round(score * 10) / 10,
    confidence: 0,
    summary: "AI analysis was unavailable. This is a simulated demo result for illustration purposes only.",
    observations: [
      "Unable to perform AI analysis - showing demo data",
      "For accurate assessment, please try again or consult a dermatologist"
    ],
    likely_patterns: ["Demo result - no real analysis performed"],
    general_options: [
      {
        title: "Consult a Professional",
        bullets: [
          "This demo result cannot provide real insights",
          "Schedule an appointment with a dermatologist for proper evaluation"
        ]
      }
    ],
    when_to_see_a_dermatologist: [
      "Anytime you have concerns about hair loss",
      "When you notice sudden or patchy hair loss"
    ],
    disclaimer: "FALLBACK DEMO RESULT: AI analysis was unavailable. This is not a real analysis. Please consult a dermatologist for any hair loss concerns."
  };
}

// Get last analyze timestamp from localStorage
function getLastAnalyzeAt(): number {
  try {
    const val = localStorage.getItem(COOLDOWN_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

// Save last analyze timestamp to localStorage
function setLastAnalyzeAt(timestamp: number): void {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(timestamp));
  } catch {
    // Ignore storage errors
  }
}

export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [usedSinglePhoto, setUsedSinglePhoto] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [rateLimitWait, setRateLimitWait] = useState(0);
  
  const inFlightRef = useRef(false);
  const lastRequestRef = useRef<{ photos: CapturedPhotos; questionnaire: QuestionnaireData } | null>(null);

  // Update cooldown countdown
  useEffect(() => {
    const updateCooldown = () => {
      const lastAt = getLastAnalyzeAt();
      const elapsed = Date.now() - lastAt;
      const remaining = Math.max(0, Math.ceil((MIN_COOLDOWN_MS - elapsed) / 1000));
      setCooldownRemaining(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update rate limit countdown
  useEffect(() => {
    if (rateLimitWait <= 0) return;
    
    const interval = setInterval(() => {
      setRateLimitWait(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [rateLimitWait]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
    setUsedFallback(false);
    setRateLimitWait(0);
  }, []);

  const analyze = useCallback(async (
    photos: CapturedPhotos,
    questionnaire: QuestionnaireData
  ): Promise<AnalysisResult | null> => {
    // Prevent double-clicks and re-entry
    if (inFlightRef.current || isAnalyzing) {
      console.log('Analysis already in progress, ignoring');
      return null;
    }

    // Check cooldown
    const lastAt = getLastAnalyzeAt();
    const elapsed = Date.now() - lastAt;
    if (elapsed < MIN_COOLDOWN_MS) {
      const waitSec = Math.ceil((MIN_COOLDOWN_MS - elapsed) / 1000);
      setError(`Please wait ${waitSec}s before trying again`);
      setErrorType('cooldown');
      return null;
    }

    // Lock immediately
    inFlightRef.current = true;
    setIsAnalyzing(true);
    setError(null);
    setErrorType(null);
    setUsedFallback(false);
    setUsedSinglePhoto(false);
    setRateLimitWait(0);
    lastRequestRef.current = { photos, questionnaire };

    // Save timestamp now (before request)
    setLastAnalyzeAt(Date.now());

    try {
      const photoArray = [photos.front, photos.left, photos.right].filter(Boolean) as string[];
      
      if (photoArray.length === 0) {
        setError('No photos to analyze');
        setErrorType('network_error');
        inFlightRef.current = false;
        setIsAnalyzing(false);
        return null;
      }

      console.log(`Compressing ${photoArray.length} photos...`);

      const compressedPhotos = await Promise.all(
        photoArray.map(photo => compressPhoto(photo, 640, 0.7))
      );

      let photosToSend = compressedPhotos;
      const totalSize = compressedPhotos.reduce((sum, p) => sum + getDataUrlSize(p), 0);

      console.log(`Total compressed size: ${(totalSize / 1024).toFixed(1)}KB`);

      if (totalSize > MAX_PAYLOAD_SIZE) {
        photosToSend = [compressedPhotos[0]];
        setUsedSinglePhoto(true);
        console.log('Payload too large, using single photo');
      }

      // Call Gemini API directly
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        setError('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
        setErrorType('server_error');
        inFlightRef.current = false;
        setIsAnalyzing(false);
        return null;
      }

      console.log('Calling Gemini API...');

      // Use only the first photo for simplicity
      const photoDataUrl = photosToSend[0];
      const [, mimeAndData] = photoDataUrl.split(',');
      const [mimeType] = photoDataUrl.match(/data:([^;]+);base64/) || ['', 'image/jpeg'];
      const actualMimeType = mimeType.replace('data:', '').replace(';base64', '');

      const userText = `Analyze hairline photo. Return JSON with: score (0-10), confidence (0-1), summary (max 80 chars), tags (array of 1-3 strings). Age:${questionnaire?.ageRange || "NA"} Timeframe:${questionnaire?.timeframe || "NA"}`;

      const requestBody = {
        contents: [{
          parts: [
            { inline_data: { mime_type: actualMimeType, data: mimeAndData } },
            { text: userText }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      };

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Gemini API Error Response:', errorData);

          if (response.status === 429) {
            setRateLimitWait(60);
            setError('Rate limit exceeded. Try again in 60s.');
            setErrorType('rate_limit');
            inFlightRef.current = false;
            setIsAnalyzing(false);
            return null;
          }

          setError(`Gemini API Error ${response.status}: ${errorData.slice(0, 200)}`);
          setErrorType('server_error');
          inFlightRef.current = false;
          setIsAnalyzing(false);
          return null;
        }

        const data = await response.json();
        console.log('Gemini API Response:', data);

        const finishReason = data?.candidates?.[0]?.finishReason;
        console.log('Finish reason:', finishReason);

        const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text ?? "").join("").trim();

        if (!text) {
          console.error('No text in response. Full response:', data);
          setError(`No response from Gemini. Reason: ${finishReason || 'unknown'}`);
          setErrorType('server_error');
          inFlightRef.current = false;
          setIsAnalyzing(false);
          return null;
        }

        console.log('Raw text from Gemini:', text);
        console.log('Text length:', text.length);

        // Check if response was truncated
        if (finishReason === 'MAX_TOKENS') {
          console.error('Response truncated due to MAX_TOKENS');
          setError('AI response was truncated. Please try again.');
          setErrorType('server_error');
          inFlightRef.current = false;
          setIsAnalyzing(false);
          return null;
        }

        // Parse the JSON response - strip markdown code blocks if present
        let jsonText = text.trim();
        // Remove markdown code fences
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
        // Try to extract JSON object if wrapped in other text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }

        console.log('Extracted JSON:', jsonText);
        console.log('Extracted JSON length:', jsonText.length);
        const parsed = JSON.parse(jsonText);
        const score = Math.max(0, Math.min(10, Number(parsed.score ?? 5)));
        const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.5)));
        const summary = String(parsed.summary ?? "Educational estimate based on the photo provided.").slice(0, 260);
        const tags = Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 3) : [];

        const result: AnalysisResult = {
          score,
          confidence,
          summary,
          observations: [
            ...(tags.map((t: string) => `Photo may suggest: ${t}.`)),
            "Lighting/angle can affect how dense the hair appears in photos."
          ].slice(0, 4),
          likely_patterns: tags.length ? tags : ["Temple recession may be present", "Hairline density may vary with lighting"],
          general_options: [
            { title: "Basics", bullets: ["Consistent monthly photos (same lighting/angle).", "Sleep, protein, stress management.", "Avoid traction/harsh styling if relevant."] },
            { title: "Common options (educational)", bullets: ["Topical minoxidil is commonly discussed.", "Ketoconazole shampoo is used by some for scalp health.", "Microneedling is discussed by some users (be cautious)."] },
            { title: "When to escalate", bullets: ["Rapid changes or irritation.", "If you want diagnosis/personal plan.", "Bring your photo timeline to a dermatologist."] }
          ],
          when_to_see_a_dermatologist: [
            "Sudden or rapidly worsening shedding over weeks.",
            "Patchy loss, pain, redness, significant flaking/itch.",
            "Any concern where you want diagnosis/treatment guidance."
          ],
          disclaimer: "Educational only — not medical advice or a diagnosis. Photo-based observations are limited. Consult a board-certified dermatologist for concerns."
        };

        console.log('Analysis completed successfully');
        inFlightRef.current = false;
        setIsAnalyzing(false);
        return result;

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Gemini API error:', errorMsg);
        throw err;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Analysis error:', errorMessage);
      
      // Network or unexpected error - use fallback
      setError('AI analysis unavailable — showing demo result');
      setErrorType('network_error');
      setUsedFallback(true);
      inFlightRef.current = false;
      setIsAnalyzing(false);
      return generateFallbackResult();
    }
  }, [isAnalyzing]);

  const retry = useCallback(async (): Promise<AnalysisResult | null> => {
    if (!lastRequestRef.current) {
      setError('No previous request to retry');
      return null;
    }

    // Clear previous error before retrying
    clearError();

    const { photos, questionnaire } = lastRequestRef.current;
    return analyze(photos, questionnaire);
  }, [analyze, clearError]);

  return {
    isAnalyzing,
    error,
    errorType,
    usedFallback,
    usedSinglePhoto,
    cooldownRemaining,
    rateLimitWait,
    analyze,
    retry,
    clearError
  };
}
