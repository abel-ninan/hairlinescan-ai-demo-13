import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/types/analysis";
import { CapturedPhotos } from "@/components/screens/CaptureScreen";
import { QuestionnaireData } from "@/components/Questionnaire";

const MAX_PAYLOAD_SIZE = 1.5 * 1024 * 1024; // 1.5MB
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

export type ErrorType = 'payload_too_large' | 'rate_limit' | 'server_error' | 'network_error';

interface UseAnalysisReturn {
  isAnalyzing: boolean;
  error: string | null;
  errorType: ErrorType | null;
  usedFallback: boolean;
  usedSinglePhoto: boolean;
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

export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [usedSinglePhoto, setUsedSinglePhoto] = useState(false);
  
  const lastRequestRef = useRef<{ photos: CapturedPhotos; questionnaire: QuestionnaireData } | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
    setUsedFallback(false);
  }, []);

  const analyze = useCallback(async (
    photos: CapturedPhotos,
    questionnaire: QuestionnaireData
  ): Promise<AnalysisResult | null> => {
    if (isAnalyzing) {
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setErrorType(null);
    setUsedFallback(false);
    setUsedSinglePhoto(false);
    lastRequestRef.current = { photos, questionnaire };

    try {
      const photoArray = [photos.front, photos.left, photos.right].filter(Boolean) as string[];
      
      if (photoArray.length === 0) {
        throw new Error('No photos to analyze');
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

          // Check for HTTP error status in the response
          const httpStatus = (response.error as any)?.status || response.data?.status;
          lastHttpStatus = httpStatus;

          // Handle 413 - Payload too large (no retry, no fallback)
          if (httpStatus === 413 || response.data?.error?.includes('too large')) {
            setError('Photos too large — please retake with smaller images');
            setErrorType('payload_too_large');
            setIsAnalyzing(false);
            return null;
          }

          // Handle 429 - Rate limit (no retry in loop, let user retry manually)
          if (httpStatus === 429 || response.data?.error?.includes('Rate limit')) {
            setError('Service is busy — please try again in a moment');
            setErrorType('rate_limit');
            setIsAnalyzing(false);
            return null;
          }

          // Handle 503 - Service unavailable (retry with backoff)
          if (httpStatus === 503) {
            throw new Error('Service temporarily unavailable');
          }

          // Handle other errors from the response
          if (response.error) {
            throw new Error(response.error.message || 'Analysis failed');
          }

          if (response.data?.error) {
            // Check if it's a rate limit error in the data
            if (response.data.error.includes('Rate limit')) {
              setError('Service is busy — please try again in a moment');
              setErrorType('rate_limit');
              setIsAnalyzing(false);
              return null;
            }
            if (response.data.error.includes('too large') || response.data.error.includes('Payload')) {
              setError('Photos too large — please retake with smaller images');
              setErrorType('payload_too_large');
              setIsAnalyzing(false);
              return null;
            }
            throw new Error(response.data.error);
          }

          // Success - return the real result
          console.log('Analysis completed successfully');
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
      setIsAnalyzing(false);
      return generateFallbackResult();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Analysis error:', errorMessage);
      
      // Network or unexpected error - use fallback
      setError('AI analysis unavailable — showing demo result');
      setErrorType('network_error');
      setUsedFallback(true);
      setIsAnalyzing(false);
      return generateFallbackResult();
    }
  }, [isAnalyzing]);

  const retry = useCallback(async (): Promise<AnalysisResult | null> => {
    if (!lastRequestRef.current) {
      setError('No previous request to retry');
      return null;
    }

    const { photos, questionnaire } = lastRequestRef.current;
    return analyze(photos, questionnaire);
  }, [analyze]);

  return {
    isAnalyzing,
    error,
    errorType,
    usedFallback,
    usedSinglePhoto,
    analyze,
    retry,
    clearError
  };
}
