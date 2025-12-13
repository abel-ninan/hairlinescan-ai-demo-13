import { useState, useEffect } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { DemoBadge } from "@/components/DemoBadge";
import { Scan, Activity, MapPin, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanningScreenProps {
  onComplete: (score: number) => void;
}

const SCAN_STEPS = [
  { label: "Calibrating sensors...", icon: Activity, duration: 1500 },
  { label: "Mapping hairline topology...", icon: MapPin, duration: 1500 },
  { label: "Estimating risk factors...", icon: AlertCircle, duration: 1500 },
  { label: "Generating protocol...", icon: FileText, duration: 1500 },
];

export const ScanningScreen = ({ onComplete }: ScanningScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const totalDuration = 6000;
    const interval = 50;
    const increment = 100 / (totalDuration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressTimer);
          // Generate stable random score (seeded by current time rounded to seconds)
          const seed = Math.floor(Date.now() / 1000);
          const score = 2 + ((seed * 9301 + 49297) % 233280) / 233280 * 7;
          setTimeout(() => onComplete(score), 500);
          return 100;
        }
        return next;
      });
    }, interval);

    // Update step based on progress
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Animated scanner icon */}
        <div className="mb-8 relative">
          <div className="inline-flex p-6 rounded-3xl bg-primary/10 border border-primary/30 scanner-glow animate-pulse-glow">
            <Scan className="w-16 h-16 text-primary" />
          </div>
          {/* Scanning rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Hairline</h2>
        <p className="text-muted-foreground mb-8">Please wait while we process your scan</p>

        {/* Progress bar */}
        <ProgressBar progress={progress} className="mb-8" />

        {/* Current step */}
        <div className="glass-panel p-4 mb-6">
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

        {/* Demo badge */}
        <DemoBadge />
      </div>
    </div>
  );
};
