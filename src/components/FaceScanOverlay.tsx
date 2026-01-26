import { cn } from "@/lib/utils";

interface FaceScanOverlayProps {
  isScanning: boolean;
  className?: string;
}

export const FaceScanOverlay = ({ isScanning, className }: FaceScanOverlayProps) => {
  if (!isScanning) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-20 overflow-hidden", className)}>
      {/* Scanning line - moves top to bottom */}
      <div
        className="absolute inset-x-0 h-[2px] animate-face-scan"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 20%, hsl(var(--primary)) 80%, transparent 100%)',
          boxShadow: '0 0 20px 4px hsl(var(--primary) / 0.4), 0 0 40px 8px hsl(var(--primary) / 0.2)',
        }}
      />

      {/* Subtle top/bottom edge highlight */}
      <div
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.08), transparent)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--primary) / 0.08), transparent)',
        }}
      />
    </div>
  );
};
