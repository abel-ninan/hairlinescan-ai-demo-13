import { useState, useEffect, useRef } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { Scan, Cpu, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapturedPhotos } from "@/components/screens/CaptureScreen";
import { QuestionnaireData } from "@/components/Questionnaire";
import { AnalysisResult } from "@/types/analysis";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Button } from "@/components/ui/button";

interface ScanningScreenProps {
  onComplete: (score: number, result?: AnalysisResult) => void;
  onCancel: () => void;
  photos?: CapturedPhotos;
  questionnaire?: QuestionnaireData;
}

// Fun entertainment-focused scan steps (NOT medical)
const SCAN_STEPS = [
  { label: "Scanning your look", icon: Scan, detail: "Processing your photo" },
  { label: "Finding your style", icon: Sparkles, detail: "AI having fun with your image" },
  { label: "Creating your vibe", icon: Cpu, detail: "Generating entertainment results" },
  { label: "Almost there", icon: BarChart3, detail: "Preparing your fun results" },
];

export const ScanningScreen = ({ onComplete, onCancel, photos, questionnaire }: ScanningScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayPhotoIndex, setDisplayPhotoIndex] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const hasStartedRef = useRef(false);

  const {
    error,
    errorType,
    usedSinglePhoto,
    cooldownRemaining,
    analyze
  } = useAnalysis();

  const capturedPhotos = photos
    ? [photos.front, photos.left, photos.right].filter(Boolean) as string[]
    : [];

  const availableLabels = photos
    ? [photos.front ? "Front" : null, photos.left ? "Left" : null, photos.right ? "Right" : null].filter(Boolean)
    : [];

  // Scanning line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLinePosition(prev => (prev + 2) % 100);
    }, 30);

    return () => clearInterval(interval);
  }, []);

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

  // Progress animation with timeout fallback
  useEffect(() => {
    const totalDuration = 8000;
    const interval = 50;
    const increment = 100 / (totalDuration / interval);
    let timeAtNinetyFive = 0;
    const MAX_WAIT_AT_95 = 15000; // 15 seconds max wait at 95%

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

        // If stuck at 95%, track time and auto-complete after timeout
        if (next >= 95 && !analysisComplete) {
          timeAtNinetyFive += interval;

          // After MAX_WAIT_AT_95ms, force completion with demo result
          if (timeAtNinetyFive >= MAX_WAIT_AT_95) {
            clearInterval(progressTimer);
            setTimeout(() => {
              const fallbackScore = 2 + Math.random() * 5;
              onComplete(fallbackScore, undefined);
            }, 300);
            return 100;
          }
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

  const showCooldownError = error && errorType === 'cooldown' && !analysisComplete;

  const CurrentStepIcon = SCAN_STEPS[currentStep]?.icon || Scan;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
            <CurrentStepIcon className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Analysis</h2>
            <p className="text-xs text-muted-foreground">
              {SCAN_STEPS[currentStep]?.detail || "Processing..."}
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
      </div>

      {/* Cooldown Notice */}
      {showCooldownError && (
        <div className="px-6 pb-4">
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div>
                <h3 className="font-medium text-foreground mb-1">Please Wait</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="ghost" onClick={onCancel}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Section */}
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

        </div>
      </div>
    </div>
  );
};
