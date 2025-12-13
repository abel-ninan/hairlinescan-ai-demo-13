import { cn } from "@/lib/utils";

interface ScannerOverlayProps {
  isScanning?: boolean;
  className?: string;
}

export const ScannerOverlay = ({ isScanning = false, className }: ScannerOverlayProps) => {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/80 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/80 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary/80 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary/80 rounded-br-lg" />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-8 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Hairline guide - oval shape at top */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-48 h-24 border-2 border-dashed border-primary/50 rounded-[50%] animate-pulse-glow" />
      </div>

      {/* Scanning line */}
      {isScanning && (
        <div className="absolute inset-x-8 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-lg shadow-primary/50" />
      )}

      {/* Center glow effect */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isScanning ? "opacity-100" : "opacity-50"
        )}
        style={{
          background: 'radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.1) 0%, transparent 50%)',
        }}
      />
    </div>
  );
};
