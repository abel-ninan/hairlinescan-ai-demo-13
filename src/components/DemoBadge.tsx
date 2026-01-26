import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBadgeProps {
  className?: string;
}

export const DemoBadge = ({ className }: DemoBadgeProps) => {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
      "bg-warning/10 text-warning",
      "text-xs font-medium",
      className
    )}>
      <AlertTriangle className="w-3 h-3" />
      <span>Demo only</span>
    </div>
  );
};
