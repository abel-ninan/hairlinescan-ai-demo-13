import { useRef, useState, useEffect, useCallback, MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { DemoBadge } from "@/components/DemoBadge";
import { Camera, SwitchCamera, X } from "lucide-react";

interface CameraScreenProps {
  onStartScan: () => void;
  onCancel: () => void;
  streamRef: MutableRefObject<MediaStream | null>;
}

export const CameraScreen = ({ onStartScan, onCancel, streamRef }: CameraScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      streamRef.current = mediaStream;
      setHasCamera(true);
      
      // Start countdown after camera is ready
      setCountdown(2);
    } catch (err) {
      console.error("Camera error:", err);
      setHasCamera(false);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, streamRef]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setHasCamera(false);
    setCountdown(null);
  }, [streamRef]);

  const switchCamera = () => {
    setCountdown(null); // Reset countdown when switching
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Handle countdown
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      onStartScan();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onStartScan]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (hasCamera) {
      startCamera();
    }
  }, [facingMode]);

  // Cleanup on unmount (but don't stop stream - it's managed by parent)
  useEffect(() => {
    return () => {
      // Don't stop the stream here - parent manages it
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Hairline Scanner</h2>
        <Button variant="ghost" size="icon" onClick={() => { stopCamera(); onCancel(); }}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Scanner Frame */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden glass-panel">
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />
              <ScannerOverlay isScanning={false} />
              
              {/* Guide label */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
                  <p className="text-sm text-foreground font-medium">Align hairline in guide</p>
                </div>
              </div>

              {/* Countdown overlay */}
              {countdown !== null && countdown > 0 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-2 rounded-full bg-primary/90 backdrop-blur-sm border border-primary/50">
                    <p className="text-sm text-primary-foreground font-medium">
                      Auto-scan starting in {countdown}…
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm mb-4">Camera not enabled</p>
              <Button 
                variant="scanner" 
                onClick={startCamera}
                disabled={isLoading}
              >
                {isLoading ? "Enabling..." : "Enable Camera"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 space-y-3">
        {hasCamera && (
          <Button 
            variant="glass" 
            className="w-full"
            onClick={switchCamera}
          >
            <SwitchCamera className="w-4 h-4" />
            Switch Camera
          </Button>
        )}
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground"
          onClick={() => { stopCamera(); onCancel(); }}
        >
          Cancel
        </Button>
      </div>

      {/* Demo badge */}
      <div className="mt-4 flex justify-center">
        <DemoBadge />
      </div>
    </div>
  );
};
