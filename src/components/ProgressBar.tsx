import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className }: ProgressBarProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary via-primary to-accent rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      </div>
      <div className="mt-2 text-right">
        <span className="font-mono text-sm text-muted-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};
