import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBadgeProps {
  className?: string;
}

export const DemoBadge = ({ className }: DemoBadgeProps) => {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
      "bg-warning/10 border border-warning/30 text-warning",
      "text-xs font-medium",
      className
    )}>
      <AlertTriangle className="w-3 h-3" />
      <span>Simulated demo • no real analysis</span>
    </div>
  );
};
