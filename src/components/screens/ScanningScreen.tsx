import { useState, useEffect } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { DemoBadge } from "@/components/DemoBadge";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { Activity, MapPin, AlertCircle, FileText, RefreshCw } from "lucide-react";
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

const SCAN_STEPS = [
  { label: "Compressing images...", icon: Activity, duration: 1500 },
  { label: "Analyzing hairline topology...", icon: MapPin, duration: 1500 },
  { label: "Evaluating patterns...", icon: AlertCircle, duration: 1500 },
  { label: "Generating report...", icon: FileText, duration: 1500 },
];

export const ScanningScreen = ({ onComplete, onCancel, photos, questionnaire }: ScanningScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayPhotoIndex, setDisplayPhotoIndex] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);

  const {
    isAnalyzing,
    error,
    usedFallback,
    usedSinglePhoto,
    analyze,
    retry
  } = useAnalysis();

  // Get array of captured photos
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

  // Start analysis ONCE when component mounts
  useEffect(() => {
    if (hasStartedAnalysis || !photos || capturedPhotos.length === 0) return;

    setHasStartedAnalysis(true);

    const runAnalysis = async () => {
      const result = await analyze(photos, questionnaire || {
        ageRange: '',
        timeframe: '',
        familyHistory: '',
        shedding: '',
        scalpIssues: ''
      });

      setAnalysisResult(result);
      setAnalysisComplete(true);
    };

    runAnalysis();
  }, [hasStartedAnalysis, photos, capturedPhotos.length, questionnaire, analyze]);

  // Handle retry
  const handleRetry = async () => {
    setAnalysisComplete(false);
    setProgress(0);
    setCurrentStep(0);
    
    const result = await retry();
    if (result) {
      setAnalysisResult(result);
      setAnalysisComplete(true);
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
        
        // If analysis is complete and we're at 100%, finish
        if (next >= 100 && analysisComplete) {
          clearInterval(progressTimer);
          setTimeout(() => {
            const score = analysisResult?.score ?? (2 + Math.random() * 7);
            onComplete(score, analysisResult || undefined);
          }, 300);
          return 100;
        }
        
        // If we hit 95% but analysis isn't complete, wait
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

  // Show error state with retry option
  const showError = error && !isAnalyzing && !analysisComplete;

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {showError ? "Analysis Error" : "Analyzing..."}
        </h2>
        <DemoBadge />
      </div>

      {/* Scanner Frame with Captured Photo */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden glass-panel">
          {/* Display captured photos */}
          {capturedPhotos.length > 0 ? (
            <img
              src={capturedPhotos[displayPhotoIndex]}
              alt="Analyzing"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-secondary/50" />
          )}
          
          {/* Scanner overlay with active scanning (hide on error) */}
          {!showError && <ScannerOverlay isScanning={true} />}

          {/* Status badge */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
            <div className={cn(
              "px-4 py-2 rounded-full backdrop-blur-sm border",
              showError 
                ? "bg-destructive/90 border-destructive/50"
                : "bg-primary/90 border-primary/50 animate-pulse"
            )}>
              <p className="text-sm text-primary-foreground font-medium">
                {showError 
                  ? "AI unavailable"
                  : analysisComplete 
                    ? 'Finalizing...' 
                    : 'AI Analysis in progress...'
                }
              </p>
            </div>
          </div>

          {/* Single photo notice */}
          {usedSinglePhoto && !showError && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
              <div className="px-3 py-1.5 rounded-full bg-warning/80 backdrop-blur-sm">
                <p className="text-xs text-warning-foreground font-medium">
                  Using primary photo for faster analysis
                </p>
              </div>
            </div>
          )}

          {/* Photo counter */}
          {capturedPhotos.length > 1 && !showError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex gap-1.5">
                {capturedPhotos.map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === displayPhotoIndex ? "bg-primary w-4" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {showError && (
        <div className="mt-6 max-w-md mx-auto w-full">
          <div className="glass-panel p-4 border-destructive/30">
            <div className="flex flex-col items-center text-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-medium text-foreground mb-1">Analysis Failed</h3>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="scanner" onClick={handleRetry} disabled={isAnalyzing}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                If this persists, a demo result will be shown.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Section - hide on error */}
      {!showError && (
        <div className="mt-6 max-w-md mx-auto w-full">
          {/* Progress bar */}
          <ProgressBar progress={progress} className="mb-6" />

          {/* Current step */}
          <div className="glass-panel p-4">
            <div className="flex flex-col gap-2">
              {SCAN_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                
                return (
                  <div 
                    key={step.label}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                      isActive && "bg-primary/10",
                      isComplete && "opacity-50"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm transition-colors",
                      isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    {isComplete && (
                      <span className="ml-auto text-xs text-success">✓</span>
                    )}
                    {isActive && (
                      <span className="ml-auto">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fallback notice */}
          {usedFallback && analysisComplete && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-xs text-center text-warning-foreground">
                ⚠️ Fallback demo result (AI unavailable)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
