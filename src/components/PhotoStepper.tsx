import { cn } from "@/lib/utils";
import { Check, Camera } from "lucide-react";

export type PhotoType = "front" | "left" | "right";

interface PhotoStepperProps {
  currentStep: PhotoType;
  photos: Record<PhotoType, string | null>;
  onStepClick: (step: PhotoType) => void;
}

const steps: { id: PhotoType; label: string }[] = [
  { id: "front", label: "Front Hairline" },
  { id: "left", label: "Left Temple" },
  { id: "right", label: "Right Temple" },
];

export const PhotoStepper = ({ currentStep, photos, onStepClick }: PhotoStepperProps) => {
  return (
    <div className="flex gap-2">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isComplete = photos[step.id] !== null;

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={cn(
              "relative flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
              "border",
              isActive ? "bg-primary/10 border-primary/40" : "bg-secondary border-border hover:border-border/80"
            )}
          >
            {/* Thumbnail or placeholder */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden",
              isComplete ? "bg-transparent" : "bg-secondary"
            )}>
              {photos[step.id] ? (
                <img
                  src={photos[step.id]!}
                  alt={step.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {/* Label */}
            <span className={cn(
              "text-[10px] font-medium leading-tight text-center",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {step.label}
            </span>

            {/* Status indicator */}
            {isComplete && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
