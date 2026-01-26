import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ProtocolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tag?: string;
  tagColor?: "primary" | "warning" | "success";
  className?: string;
  delay?: number;
}

export const ProtocolCard = ({ 
  icon: Icon, 
  title, 
  description, 
  tag, 
  tagColor = "primary",
  className,
  delay = 0 
}: ProtocolCardProps) => {
  const tagColors = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
  };

  return (
    <div
      className={cn(
        "glass-panel p-4 opacity-0 animate-fade-up transition-colors duration-200",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground text-sm">{title}</h3>
            {tag && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full", tagColors[tagColor])}>
                {tag}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};
