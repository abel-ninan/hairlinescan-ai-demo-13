import { useState, useEffect, useRef } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { Activity, MapPin, AlertCircle, FileText, RefreshCw, ImageOff, Clock, Scan, Cpu, BarChart3, Dna } from "lucide-react";
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
  { label: "Preprocessing images", icon: Scan, detail: "Normalizing contrast & resolution" },
  { label: "Analyzing follicle density", icon: Dna, detail: "Mapping hairline topology" },
  { label: "Pattern recognition", icon: Cpu, detail: "AI classification in progress" },
  { label: "Generating assessment", icon: BarChart3, detail: "Compiling results" },
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
  const [scanLinePosition, setScanLinePosition] = useState(0);
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

  const photoLabels = ["Front View", "Left Profile", "Right Profile"];
  const availableLabels = photos
    ? [photos.front ? "Front" : null, photos.left ? "Left" : null, photos.right ? "Right" : null].filter(Boolean)
    : [];

  // Scanning line animation
  useEffect(() => {
    if (error) return;

    const interval = setInterval(() => {
      setScanLinePosition(prev => (prev + 2) % 100);
    }, 30);

    return () => clearInterval(interval);
  }, [error]);

  // Cycle through photos during scanning
  useEffect(() => {
    if (capturedPhotos.length <= 1) return;

    const interval = setInterval(() => {
      setDisplayPhotoIndex(prev => (prev + 1) % capturedPhotos.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [capturedPhotos.length]);

  // Start analysis ONCE when component mounts
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
      } catch {
        // Errors handled in useAnalysis
      }
    };

    runAnalysis();
  }, [photos, capturedPhotos.length, questionnaire, analyze]);

  // Handle retry
  const handleRetry = async () => {
    if (rateLimitWait > 0 || cooldownRemaining > 0) return;

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
      // Errors handled in useAnalysis
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

  const showError = error && errorType && !isAnalyzing && !analysisComplete;
  const errorConfig = errorType ? ERROR_CONFIG[errorType] : null;
  const ErrorIcon = errorConfig?.icon || AlertCircle;

  const retryBlocked = rateLimitWait > 0 || cooldownRemaining > 0 || isAnalyzing;
  const retryButtonText = rateLimitWait > 0
    ? `Wait ${rateLimitWait}s`
    : cooldownRemaining > 0
      ? `Wait ${cooldownRemaining}s`
      : 'Try Again';

  const CurrentStepIcon = SCAN_STEPS[currentStep]?.icon || Activity;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            showError ? "bg-destructive/10" : "bg-primary/10"
          )}>
            {showError ? (
              <ErrorIcon className="w-5 h-5 text-destructive" />
            ) : (
              <CurrentStepIcon className={cn("w-5 h-5 text-primary", !showError && "animate-pulse")} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {showError ? errorConfig?.title || "Analysis Error" : "AI Analysis"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {showError
                ? "Unable to complete analysis"
                : SCAN_STEPS[currentStep]?.detail || "Processing..."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Photo Display with Scanning Effect */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {capturedPhotos.length > 0 && (
          <div className="relative w-full max-w-sm">
            {/* Photo Container with Scientific Overlay */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/90 shadow-2xl">
              {/* The Photo */}
              <img
                src={capturedPhotos[displayPhotoIndex]}
                alt={`Analyzing ${availableLabels[displayPhotoIndex] || 'photo'}`}
                className="w-full h-full object-cover"
              />

              {/* Scanning Overlay */}
              {!showError && (
                <>
                  {/* Grid overlay for scientific look */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                  />

                  {/* Scanning line */}
                  <div
                    className="absolute left-0 right-0 h-1 pointer-events-none"
                    style={{
                      top: `${scanLinePosition}%`,
                      background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 1), rgba(34, 197, 94, 0.8), transparent)',
                      boxShadow: '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)'
                    }}
                  />

                  {/* Corner brackets */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary/70" />
                  <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary/70" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary/70" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary/70" />

                  {/* Data readout overlay */}
                  <div className="absolute top-4 right-4 text-right">
                    <div className="text-[10px] font-mono text-primary/80 bg-black/50 px-2 py-1 rounded">
                      ANALYZING
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4">
                    <div className="text-[10px] font-mono text-primary/80 bg-black/50 px-2 py-1 rounded">
                      {availableLabels[displayPhotoIndex]?.toUpperCase() || "SCAN"} {displayPhotoIndex + 1}/{capturedPhotos.length}
                    </div>
                  </div>
                </>
              )}

              {/* Error overlay */}
              {showError && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <ErrorIcon className="w-16 h-16 text-destructive/70" />
                </div>
              )}
            </div>

            {/* Photo indicator dots */}
            {capturedPhotos.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {capturedPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDisplayPhotoIndex(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === displayPhotoIndex
                        ? "bg-primary w-8"
                        : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current step display */}
        {!showError && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <CurrentStepIcon className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {analysisComplete ? 'Analysis complete' : SCAN_STEPS[currentStep]?.label || 'Processing...'}
              </span>
            </div>
            {usedSinglePhoto && (
              <p className="text-xs text-muted-foreground mt-2">
                Using primary photo for optimized analysis
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {showError && errorConfig && (
        <div className="px-6 pb-4">
          <div className="glass-panel p-4 border-destructive/30 rounded-xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div>
                <h3 className="font-medium text-foreground mb-1">{errorConfig.title}</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-3">
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
                <p className="text-xs text-muted-foreground mt-1">
                  A demo result will be shown if analysis continues to fail.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Section */}
      {!showError && (
        <div className="p-6 pt-0">
          <div className="max-w-sm mx-auto">
            <ProgressBar progress={progress} className="mb-4" />

            {/* Step indicators */}
            <div className="flex justify-between">
              {SCAN_STEPS.map((step, index) => {
                const isComplete = index < currentStep;
                const isActive = index === currentStep;
                const StepIcon = step.icon;
                return (
                  <div key={step.label} className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all border-2",
                      isComplete ? "bg-primary border-primary text-primary-foreground" :
                      isActive ? "bg-primary/10 border-primary text-primary" :
                      "bg-secondary border-transparent text-muted-foreground"
                    )}>
                      {isComplete ? (
                        <span className="text-xs font-bold">✓</span>
                      ) : (
                        <StepIcon className="w-4 h-4" />
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
        </div>
      )}
    </div>
  );
};
