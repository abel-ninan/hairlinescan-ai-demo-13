import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/types/analysis";
import { CapturedPhotos } from "@/components/screens/CaptureScreen";
import { QuestionnaireData } from "@/components/Questionnaire";

const MAX_PAYLOAD_SIZE = 1.5 * 1024 * 1024; // 1.5MB
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

interface UseAnalysisReturn {
  isAnalyzing: boolean;
  error: string | null;
  usedFallback: boolean;
  usedSinglePhoto: boolean;
  analyze: (photos: CapturedPhotos, questionnaire: QuestionnaireData) => Promise<AnalysisResult>;
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
  // Remove the data URL prefix to get the base64 part
  const base64 = dataUrl.split(',')[1] || '';
  // Base64 encodes 6 bits per character, so 4 characters = 3 bytes
  return Math.ceil((base64.length * 3) / 4);
}

// Generate fallback demo result
function generateFallbackResult(): AnalysisResult {
  const score = 2 + Math.random() * 5; // 2-7 range
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
  const [usedFallback, setUsedFallback] = useState(false);
  const [usedSinglePhoto, setUsedSinglePhoto] = useState(false);
  
  // Store last request for retry
  const lastRequestRef = useRef<{ photos: CapturedPhotos; questionnaire: QuestionnaireData } | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setUsedFallback(false);
  }, []);

  const analyze = useCallback(async (
    photos: CapturedPhotos,
    questionnaire: QuestionnaireData
  ): Promise<AnalysisResult> => {
    // Prevent duplicate calls
    if (isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    setIsAnalyzing(true);
    setError(null);
    setUsedFallback(false);
    setUsedSinglePhoto(false);
    lastRequestRef.current = { photos, questionnaire };

    try {
      // Get array of captured photos
      const photoArray = [photos.front, photos.left, photos.right].filter(Boolean) as string[];
      
      if (photoArray.length === 0) {
        throw new Error('No photos to analyze');
      }

      console.log(`Compressing ${photoArray.length} photos...`);

      // Compress all photos
      const compressedPhotos = await Promise.all(
        photoArray.map(photo => compressPhoto(photo, 640, 0.7))
      );

      // Check total payload size and trim if needed
      let photosToSend = compressedPhotos;
      let totalSize = compressedPhotos.reduce((sum, p) => sum + getDataUrlSize(p), 0);

      console.log(`Total compressed size: ${(totalSize / 1024).toFixed(1)}KB`);

      if (totalSize > MAX_PAYLOAD_SIZE) {
        // Only send the first photo
        photosToSend = [compressedPhotos[0]];
        setUsedSinglePhoto(true);
        console.log('Payload too large, using single photo');
      }

      // Retry logic with exponential backoff
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          console.log(`Analysis attempt ${attempt + 1}/${MAX_RETRIES}`);

          const { data, error: invokeError } = await supabase.functions.invoke('analyze_hairline', {
            body: {
              photos: photosToSend,
              answers: questionnaire
            }
          });

          if (invokeError) {
            const status = (invokeError as any)?.status;
            // Check for rate limit or server errors that warrant retry
            if (status === 429 || status === 503) {
              throw new Error(`Server returned ${status}`);
            }
            throw new Error(invokeError.message || 'Analysis failed');
          }

          if (data?.error) {
            throw new Error(data.error);
          }

          // Success!
          console.log('Analysis completed successfully');
          setIsAnalyzing(false);
          return data as AnalysisResult;

        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

          // If we have more retries, wait before trying again
          if (attempt < MAX_RETRIES - 1) {
            const delay = RETRY_DELAYS[attempt];
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed - use fallback
      console.log('All retries failed, using fallback result');
      setUsedFallback(true);
      setError(lastError?.message || 'Analysis failed after multiple attempts');
      setIsAnalyzing(false);
      return generateFallbackResult();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Analysis error:', errorMessage);
      setError(errorMessage);
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
    usedFallback,
    usedSinglePhoto,
    analyze,
    retry,
    clearError
  };
}
