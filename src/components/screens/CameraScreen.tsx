import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { Camera, SwitchCamera, X, Scan } from "lucide-react";

interface CameraScreenProps {
  onCapture: () => void;
  onCancel: () => void;
}

export const CameraScreen = ({ onCapture, onCancel }: CameraScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setHasCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      setHasCamera(false);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setHasCamera(false);
  }, [stream]);

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  useEffect(() => {
    if (hasCamera) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
          <div className="flex gap-3">
            <Button 
              variant="glass" 
              className="flex-1"
              onClick={switchCamera}
            >
              <SwitchCamera className="w-4 h-4" />
              Switch Camera
            </Button>
            <Button 
              variant="scanner" 
              className="flex-1"
              onClick={() => { stopCamera(); onCapture(); }}
            >
              <Scan className="w-4 h-4" />
              Begin Scan
            </Button>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground"
          onClick={() => { stopCamera(); onCancel(); }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
