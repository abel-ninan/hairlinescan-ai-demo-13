import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check } from "lucide-react";

interface PhotoCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  facingMode: "user" | "environment";
  capturedPhoto: string | null;
  onCapture: (dataUrl: string) => void;
  onRetake: () => void;
  onUse: () => void;
  hasCamera: boolean;
  onScanStart?: () => void;
  onScanEnd?: () => void;
}

export const PhotoCapture = ({
  videoRef,
  facingMode,
  capturedPhoto,
  onCapture,
  onRetake,
  onUse,
  hasCamera,
  onScanStart,
  onScanEnd,
}: PhotoCaptureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const performCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate dimensions (max 1024 width)
    const maxWidth = 1024;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;

    canvas.width = width;
    canvas.height = height;

    // Handle mirroring for front camera
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Convert to JPEG with compression
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
  }, [videoRef, facingMode, onCapture]);

  const capturePhoto = useCallback(() => {
    setIsScanning(true);
    onScanStart?.();

    // Run scanning animation for 1.2 seconds before capturing
    setTimeout(() => {
      performCapture();
      setIsScanning(false);
      onScanEnd?.();
    }, 1200);
  }, [performCapture, onScanStart, onScanEnd]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      
      {capturedPhoto ? (
        <div className="space-y-3">
          {/* Preview thumbnail */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/50">
            <img 
              src={capturedPhoto} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button 
              variant="glass" 
              className="flex-1"
              onClick={onRetake}
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </Button>
            <Button 
              variant="scanner" 
              className="flex-1"
              onClick={onUse}
            >
              <Check className="w-4 h-4" />
              Use Photo
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="scanner"
          className="w-full"
          onClick={capturePhoto}
          disabled={!hasCamera || isScanning}
        >
          {isScanning ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Capture Photo
            </>
          )}
        </Button>
      )}
    </>
  );
};
