import { useRef, useState, useEffect, useCallback, MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { FaceScanOverlay } from "@/components/FaceScanOverlay";
import { PhotoCapture } from "@/components/PhotoCapture";
import { PhotoStepper, PhotoType } from "@/components/PhotoStepper";
import { Questionnaire, QuestionnaireData } from "@/components/Questionnaire";
import { SwitchCamera, X, Sparkles } from "lucide-react";

export interface CapturedPhotos {
  front: string | null;
  left: string | null;
  right: string | null;
}

interface CaptureScreenProps {
  onAnalyze: (photos: CapturedPhotos, questionnaire: QuestionnaireData) => void;
  onCancel: () => void;
  streamRef: MutableRefObject<MediaStream | null>;
}

const initialQuestionnaire: QuestionnaireData = {
  ageRange: "",
  timeframe: "",
  familyHistory: "",
  shedding: "",
  scalpIssues: "",
};

export const CaptureScreen = ({ onAnalyze, onCancel, streamRef }: CaptureScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [consent, setConsent] = useState(false);
  
  const [currentPhotoStep, setCurrentPhotoStep] = useState<PhotoType>("front");
  const [photos, setPhotos] = useState<CapturedPhotos>({ front: null, left: null, right: null });
  const [tempCapture, setTempCapture] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>(initialQuestionnaire);

  const hasAtLeastOnePhoto = photos.front !== null || photos.left !== null || photos.right !== null;
  const canAnalyze = consent && hasAtLeastOnePhoto;

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    try {
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
    } catch {
      // Camera access denied or not available
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
  }, [streamRef]);

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const handleCapture = (dataUrl: string) => {
    setTempCapture(dataUrl);
  };

  const handleRetake = async () => {
    setTempCapture(null);
    // Re-attach stream to video element
    setTimeout(async () => {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        try {
          await videoRef.current.play();
        } catch {
          // Video play failed - may be interrupted
        }
      }
    }, 50);
  };

  const handleUsePhoto = async () => {
    if (tempCapture) {
      setPhotos(prev => ({ ...prev, [currentPhotoStep]: tempCapture }));
      setTempCapture(null);

      // Auto-advance to next step if available
      const steps: PhotoType[] = ["front", "left", "right"];
      const currentIndex = steps.indexOf(currentPhotoStep);
      const nextStep = steps.find((s, i) => i > currentIndex && photos[s] === null);
      if (nextStep) {
        setCurrentPhotoStep(nextStep);
      }

      // Re-attach stream to video element after clearing tempCapture
      setTimeout(async () => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          try {
            await videoRef.current.play();
          } catch {
            // Video play failed - may be interrupted
          }
        }
      }, 50);
    }
  };

  const handleStepClick = (step: PhotoType) => {
    setCurrentPhotoStep(step);
    setTempCapture(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnalyze = () => {
    if (isSubmitting || !canAnalyze) return;
    setIsSubmitting(true);
    stopCamera();
    onAnalyze(photos, questionnaire);
  };

  // Restart camera when facing mode changes
  useEffect(() => {
    if (hasCamera) {
      startCamera();
    }
  }, [facingMode, hasCamera, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't stop stream here - parent manages it
    };
  }, []);

  const stepLabels: Record<PhotoType, string> = {
    front: "Front View",
    left: "Left Side",
    right: "Right Side"
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Capture Photos</h2>
        <Button variant="ghost" size="icon" onClick={() => { stopCamera(); onCancel(); }}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Photo Stepper */}
      <div className="mb-4">
        <PhotoStepper 
          currentStep={currentPhotoStep}
          photos={photos}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Camera/Capture Area */}
      <div className="flex-1 flex flex-col">
        <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-3xl overflow-hidden glass-panel mb-4">
          {hasCamera && !tempCapture ? (
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
              <FaceScanOverlay isScanning={isScanning} />

              {/* Guide label */}
              {!isScanning && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border">
                    <p className="text-sm text-foreground font-medium">
                      {stepLabels[currentPhotoStep]}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : tempCapture ? (
            <img 
              src={tempCapture} 
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
              <SwitchCamera className="w-16 h-16 text-muted-foreground mb-4" />
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

        {/* Capture Controls */}
        {hasCamera && (
          <div className="max-w-md mx-auto w-full space-y-3 mb-4">
            <PhotoCapture
              videoRef={videoRef}
              facingMode={facingMode}
              capturedPhoto={tempCapture}
              onCapture={handleCapture}
              onRetake={handleRetake}
              onUse={handleUsePhoto}
              hasCamera={hasCamera}
              onScanStart={() => setIsScanning(true)}
              onScanEnd={() => setIsScanning(false)}
            />
            
            {!tempCapture && (
              <Button 
                variant="glass" 
                className="w-full"
                onClick={switchCamera}
              >
                <SwitchCamera className="w-4 h-4" />
                Switch Camera
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Questionnaire */}
      <div className="max-w-md mx-auto w-full glass-panel p-4 rounded-xl mb-4">
        <Questionnaire data={questionnaire} onChange={setQuestionnaire} />
      </div>

      {/* Consent */}
      <div className="max-w-md mx-auto w-full mb-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <Checkbox 
            id="consent" 
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I understand this is for entertainment only, not medical advice. Results are just for fun!
          </Label>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="max-w-md mx-auto w-full space-y-3">
        <Button 
          variant="scanner"
          size="xl"
          className="w-full"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze Photos
            </>
          )}
        </Button>
        
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
