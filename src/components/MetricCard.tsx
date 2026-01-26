import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  className?: string;
  delay?: number;
}

export const MetricCard = ({ label, value, subtext, className, delay = 0 }: MetricCardProps) => {
  return (
    <div
      className={cn(
        "glass-panel p-4 text-center opacity-0 animate-fade-up",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono text-lg font-medium text-foreground">{value}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
};
