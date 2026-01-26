import { useState, useEffect, useRef } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { Activity, MapPin, AlertCircle, FileText, RefreshCw, ImageOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapturedPhotos } from "@/components/screens/CaptureScreen";
import { QuestionnaireData } from "@/components/Questionnaire";
import { AnalysisResult } from "@/types/analysis";
import { useAnalysis, ErrorType } from "@/hooks/useAnalysis";
import { Button } from "@/components/ui/button";

interface ScanningScreenProps {
  onComplete: (score: number, result?: AnalysisResult) => void;
  onCancel: () => void;
  photos?: CapturedPhotos;
  questionnaire?: QuestionnaireData;
}

const SCAN_STEPS = [
  { label: "Compressing images...", icon: Activity, duration: 1500 },
  { label: "Analyzing hairline topology...", icon: MapPin, duration: 1500 },
  { label: "Evaluating patterns...", icon: AlertCircle, duration: 1500 },
  { label: "Generating report...", icon: FileText, duration: 1500 },
];

const ERROR_CONFIG: Record<ErrorType, { icon: typeof AlertCircle; title: string; canRetry: boolean; showFallback: boolean }> = {
  payload_too_large: {
    icon: ImageOff,
    title: "Photos Too Large",
    canRetry: false,
    showFallback: false
  },
  rate_limit: {
    icon: Clock,
    title: "Service Busy",
    canRetry: true,
    showFallback: false
  },
  server_error: {
    icon: AlertCircle,
    title: "AI Unavailable",
    canRetry: true,
    showFallback: true
  },
  network_error: {
    icon: AlertCircle,
    title: "Connection Error",
    canRetry: true,
    showFallback: true
  },
  cooldown: {
    icon: Clock,
    title: "Please Wait",
    canRetry: false,
    showFallback: false
  }
};

export const ScanningScreen = ({ onComplete, onCancel, photos, questionnaire }: ScanningScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayPhotoIndex, setDisplayPhotoIndex] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const hasStartedRef = useRef(false);

  const {
    isAnalyzing,
    error,
    errorType,
    usedFallback,
    usedSinglePhoto,
    cooldownRemaining,
    rateLimitWait,
    analyze,
    retry
  } = useAnalysis();

  const capturedPhotos = photos 
    ? [photos.front, photos.left, photos.right].filter(Boolean) as string[]
    : [];

  // Cycle through photos during scanning
  useEffect(() => {
    if (capturedPhotos.length <= 1) return;
    
    const interval = setInterval(() => {
      setDisplayPhotoIndex(prev => (prev + 1) % capturedPhotos.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [capturedPhotos.length]);

  // Start analysis ONCE when component mounts - using ref to prevent double-firing
  useEffect(() => {
    if (hasStartedRef.current || !photos || capturedPhotos.length === 0) return;

    hasStartedRef.current = true;

    const runAnalysis = async () => {
      try {
        const result = await analyze(photos, questionnaire || {
          ageRange: '',
          timeframe: '',
          familyHistory: '',
          shedding: '',
          scalpIssues: ''
        });

        if (result) {
          setAnalysisResult(result);
          setAnalysisComplete(true);
        }
        // If result is null, error state will be shown via error/errorType
      } catch {
        // Never throw - errors are handled in useAnalysis
      }
    };

    runAnalysis();
  }, [photos, capturedPhotos.length, questionnaire, analyze]);

  // Handle retry
  const handleRetry = async () => {
    // Check if rate limit wait is active
    if (rateLimitWait > 0) {
      return;
    }
    
    // Check cooldown
    if (cooldownRemaining > 0) {
      return;
    }

    setAnalysisComplete(false);
    setProgress(0);
    setCurrentStep(0);
    
    try {
      const result = await retry();
      if (result) {
        setAnalysisResult(result);
        setAnalysisComplete(true);
      }
    } catch {
      // Never throw - errors are handled in useAnalysis
    }
  };

  // Progress animation
  useEffect(() => {
    const totalDuration = 8000;
    const interval = 50;
    const increment = 100 / (totalDuration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        
        if (next >= 100 && analysisComplete) {
          clearInterval(progressTimer);
          setTimeout(() => {
            const score = analysisResult?.score ?? (2 + Math.random() * 7);
            onComplete(score, analysisResult || undefined);
          }, 300);
          return 100;
        }
        
        if (next >= 95 && !analysisComplete) {
          return 95;
        }
        
        return Math.min(next, 100);
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, [onComplete, analysisComplete, analysisResult]);

  // Update step based on progress
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < SCAN_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(stepTimer);
        return prev;
      });
    }, 2000);

    return () => clearInterval(stepTimer);
  }, []);

  // Show error state - only for non-fallback errors or when not complete
  const showError = error && errorType && !isAnalyzing && !analysisComplete;
  const errorConfig = errorType ? ERROR_CONFIG[errorType] : null;
  const ErrorIcon = errorConfig?.icon || AlertCircle;

  // Determine if retry is currently blocked
  const retryBlocked = rateLimitWait > 0 || cooldownRemaining > 0 || isAnalyzing;
  const retryButtonText = rateLimitWait > 0 
    ? `Wait ${rateLimitWait}s` 
    : cooldownRemaining > 0 
      ? `Wait ${cooldownRemaining}s` 
      : 'Try Again';

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {showError ? errorConfig?.title || "Analysis Error" : "Analyzing..."}
        </h2>
      </div>

      {/* Logo-centered Loading View */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          {/* Logo with pulse animation */}
          <div className={cn(
            "relative mb-8",
            !showError && "animate-pulse"
          )}>
            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-primary/20">
              <img
                src="/logo.png"
                alt="HairlineScan"
                className="w-full h-full object-cover"
              />
            </div>
            {!showError && (
              <div className="absolute inset-0 rounded-3xl border-2 border-primary/50 animate-ping" style={{ animationDuration: '2s' }} />
            )}
          </div>

          {/* Status text */}
          <div className={cn(
            "px-6 py-3 rounded-full",
            showError
              ? "bg-destructive/10 border border-destructive/30"
              : "bg-primary/10 border border-primary/30"
          )}>
            <p className={cn(
              "text-sm font-medium",
              showError ? "text-destructive" : "text-primary"
            )}>
              {showError
                ? errorConfig?.title || "Error"
                : analysisComplete
                  ? 'Finalizing...'
                  : SCAN_STEPS[currentStep]?.label || 'Analyzing...'
              }
            </p>
          </div>

          {/* Photo indicator dots */}
          {capturedPhotos.length > 1 && !showError && (
            <div className="flex gap-2 mt-6">
              {capturedPhotos.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    i === displayPhotoIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}

          {usedSinglePhoto && !showError && (
            <p className="text-xs text-muted-foreground mt-4">
              Using primary photo for faster analysis
            </p>
          )}
        </div>
      </div>

      {/* Error State */}
      {showError && errorConfig && (
        <div className="mt-6 max-w-md mx-auto w-full">
          <div className="glass-panel p-4 border-destructive/30">
            <div className="flex flex-col items-center text-center gap-3">
              <ErrorIcon className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-medium text-foreground mb-1">{errorConfig.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                {errorConfig.canRetry && (
                  <Button 
                    variant="scanner" 
                    onClick={handleRetry} 
                    disabled={retryBlocked}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isAnalyzing && "animate-spin")} />
                    {retryButtonText}
                  </Button>
                )}
                <Button variant="ghost" onClick={onCancel}>
                  {errorType === 'payload_too_large' ? 'Retake Photos' : 'Cancel'}
                </Button>
              </div>
              {errorConfig.showFallback && (
                <p className="text-xs text-muted-foreground mt-2">
                  A demo result will be shown if analysis continues to fail.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Section - hide on error */}
      {!showError && (
        <div className="mt-8 max-w-md mx-auto w-full">
          <ProgressBar progress={progress} className="mb-4" />

          {/* Step indicators */}
          <div className="flex justify-between px-2">
            {SCAN_STEPS.map((step, index) => {
              const isComplete = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div key={step.label} className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isComplete ? "bg-primary text-primary-foreground" :
                    isActive ? "bg-primary/20 text-primary border-2 border-primary" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {isComplete ? (
                      <span className="text-xs">✓</span>
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fallback notice */}
          {usedFallback && analysisComplete && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-xs text-center text-warning-foreground">
                Demo result shown (AI unavailable)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
