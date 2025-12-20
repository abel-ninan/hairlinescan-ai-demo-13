import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      let totalSize = compressedPhotos.reduce((sum, p) => sum + getDataUrlSize(p), 0);

      console.log(`Total compressed size: ${(totalSize / 1024).toFixed(1)}KB`);

      if (totalSize > MAX_PAYLOAD_SIZE) {
        photosToSend = [compressedPhotos[0]];
        setUsedSinglePhoto(true);
        console.log('Payload too large, using single photo');
      }

      // Retry logic with exponential backoff for 503 only
      let lastHttpStatus: number | null = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          console.log(`Analysis attempt ${attempt + 1}/${MAX_RETRIES}`);

          const response = await supabase.functions.invoke('analyze_hairline', {
            body: {
              photos: photosToSend,
              answers: questionnaire
            }
          });

          // Get HTTP status - Supabase wraps errors
          const httpStatus = (response.error as any)?.status;
          lastHttpStatus = httpStatus;

          // Handle 413 - Payload too large (no retry, no fallback)
          if (httpStatus === 413 || response.data?.error?.includes('too large')) {
            setError('Photos too large — please retake with smaller images');
            setErrorType('payload_too_large');
            inFlightRef.current = false;
            setIsAnalyzing(false);
            return null;
          }

          // Handle 429 - Rate limit (NO FALLBACK, show message with wait time)
          if (httpStatus === 429 || response.data?.error?.includes('Rate limit')) {
            // Try to parse Retry-After header if available
            let waitSeconds = DEFAULT_RATE_LIMIT_WAIT;
            
            // Note: Supabase client doesn't expose headers directly, but the edge function 
            // might return the wait time in the error message
            const errorMsg = response.data?.error || '';
            const match = errorMsg.match(/(\d+)\s*seconds?/i);
            if (match) {
              waitSeconds = parseInt(match[1], 10);
            }
            
            setRateLimitWait(waitSeconds);
            setError(`Busy (rate limited). Try again in ${waitSeconds}s.`);
            setErrorType('rate_limit');
            inFlightRef.current = false;
            setIsAnalyzing(false);
            return null;
          }

          // Handle 503 - Service unavailable (retry with backoff)
          if (httpStatus === 503) {
            throw new Error('Service temporarily unavailable');
          }

          // Handle other errors from the response
          if (response.error) {
            // Check message for rate limit indicators
            const errMsg = response.error.message || '';
            if (errMsg.includes('Rate limit') || errMsg.includes('429')) {
              setRateLimitWait(DEFAULT_RATE_LIMIT_WAIT);
              setError(`Busy (rate limited). Try again in ${DEFAULT_RATE_LIMIT_WAIT}s.`);
              setErrorType('rate_limit');
              inFlightRef.current = false;
              setIsAnalyzing(false);
              return null;
            }
            throw new Error(response.error.message || 'Analysis failed');
          }

          if (response.data?.error) {
            // Check if it's a rate limit error in the data
            if (response.data.error.includes('Rate limit')) {
              setRateLimitWait(DEFAULT_RATE_LIMIT_WAIT);
              setError(`Busy (rate limited). Try again in ${DEFAULT_RATE_LIMIT_WAIT}s.`);
              setErrorType('rate_limit');
              inFlightRef.current = false;
              setIsAnalyzing(false);
              return null;
            }
            if (response.data.error.includes('too large') || response.data.error.includes('Payload')) {
              setError('Photos too large — please retake with smaller images');
              setErrorType('payload_too_large');
              inFlightRef.current = false;
              setIsAnalyzing(false);
              return null;
            }
            throw new Error(response.data.error);
          }

          // Success - return the real result
          console.log('Analysis completed successfully');
          inFlightRef.current = false;
          setIsAnalyzing(false);
          return response.data as AnalysisResult;

        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`Attempt ${attempt + 1} failed:`, errorMsg);

          // Only retry on 503 errors
          if (lastHttpStatus === 503 && attempt < MAX_RETRIES - 1) {
            const delay = RETRY_DELAYS[attempt];
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          // For other errors, break out of retry loop
          break;
        }
      }

      // All retries failed or non-retriable error - use fallback for 500/network errors
      console.log('Using fallback result due to server/network error');
      setUsedFallback(true);
      setError('AI analysis unavailable — showing demo result');
      setErrorType('server_error');
      inFlightRef.current = false;
      setIsAnalyzing(false);
      return generateFallbackResult();

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
