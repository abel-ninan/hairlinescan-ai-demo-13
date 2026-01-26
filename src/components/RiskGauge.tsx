import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  score: number;
  className?: string;
}

export const RiskGauge = ({ score, className }: RiskGaugeProps) => {
  const normalizedScore = Math.max(0, Math.min(10, score));
  const percentage = (normalizedScore / 10) * 100;

  const getColor = () => {
    if (normalizedScore <= 3) return "text-success";
    if (normalizedScore <= 6) return "text-warning";
    return "text-destructive";
  };

  const getLabel = () => {
    if (normalizedScore <= 3) return "Low Risk";
    if (normalizedScore <= 6) return "Moderate";
    return "Elevated";
  };

  return (
    <div className={cn("text-center", className)}>
      {/* Circular gauge */}
      <div className="relative w-44 h-44 mx-auto mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.64} 264`}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--success))" />
              <stop offset="50%" stopColor="hsl(var(--warning))" />
              <stop offset="100%" stopColor="hsl(var(--destructive))" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-mono text-4xl font-semibold", getColor())}>
            {normalizedScore.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      </div>

      {/* Label */}
      <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm", getColor())}>
        <div className={cn("w-1.5 h-1.5 rounded-full",
          normalizedScore <= 3 ? "bg-success" :
          normalizedScore <= 6 ? "bg-warning" : "bg-destructive"
        )} />
        <span className="font-medium">{getLabel()}</span>
      </div>
    </div>
  );
};
