import { useState, useEffect } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { DemoBadge } from "@/components/DemoBadge";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { Activity, MapPin, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapturedPhotos } from "@/components/screens/CaptureScreen";

interface ScanningScreenProps {
  onComplete: (score: number) => void;
  photos?: CapturedPhotos;
}

const SCAN_STEPS = [
  { label: "Calibrating sensors...", icon: Activity, duration: 1500 },
  { label: "Mapping hairline topology...", icon: MapPin, duration: 1500 },
  { label: "Estimating risk factors...", icon: AlertCircle, duration: 1500 },
  { label: "Generating protocol...", icon: FileText, duration: 1500 },
];

export const ScanningScreen = ({ onComplete, photos }: ScanningScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayPhotoIndex, setDisplayPhotoIndex] = useState(0);

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

  useEffect(() => {
    const totalDuration = 6000;
    const interval = 50;
    const increment = 100 / (totalDuration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressTimer);
          const seed = Math.floor(Date.now() / 1000);
          const score = 2 + ((seed * 9301 + 49297) % 233280) / 233280 * 7;
          setTimeout(() => onComplete(score), 500);
          return 100;
        }
        return next;
      });
    }, interval);

    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < SCAN_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(stepTimer);
        return prev;
      });
    }, 1500);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Analyzing...</h2>
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
          
          {/* Scanner overlay with active scanning */}
          <ScannerOverlay isScanning={true} />

          {/* Scanning status in frame */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
            <div className="px-4 py-2 rounded-full bg-primary/90 backdrop-blur-sm border border-primary/50 animate-pulse">
              <p className="text-sm text-primary-foreground font-medium">Analyzing photos...</p>
            </div>
          </div>

          {/* Photo counter */}
          {capturedPhotos.length > 1 && (
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

      {/* Progress Section */}
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
      </div>
    </div>
  );
};
