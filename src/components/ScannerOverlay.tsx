import { cn } from "@/lib/utils";

interface ScannerOverlayProps {
  isScanning?: boolean;
  className?: string;
}

export const ScannerOverlay = ({ isScanning = false, className }: ScannerOverlayProps) => {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Corner brackets - minimal */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l border-t border-primary/60 rounded-tl-md" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r border-t border-primary/60 rounded-tr-md" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l border-b border-primary/60 rounded-bl-md" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r border-b border-primary/60 rounded-br-md" />

      {/* Scanning line */}
      {isScanning && (
        <div className="absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent animate-scan-line" />
      )}

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, hsl(var(--background)) 100%)',
        }}
      />
    </div>
  );
};
