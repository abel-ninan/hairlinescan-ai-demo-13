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
    primary: "bg-primary/20 text-primary border-primary/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    success: "bg-success/20 text-success border-success/30",
  };

  return (
    <div 
      className={cn(
        "glass-panel p-5 opacity-0 animate-fade-up hover:border-primary/30 transition-all duration-300",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {tag && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full border", tagColors[tagColor])}>
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
