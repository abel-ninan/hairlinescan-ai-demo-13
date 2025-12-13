import { useState, useRef } from "react";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { CameraScreen } from "@/components/screens/CameraScreen";
import { ScanningScreen } from "@/components/screens/ScanningScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";

type AppScreen = "landing" | "camera" | "scanning" | "results";

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [riskScore, setRiskScore] = useState<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStart = () => {
    setScreen("camera");
  };

  const handleStartScan = () => {
    setScreen("scanning");
  };

  const handleScanComplete = (score: number) => {
    // Stop the camera when scan completes
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setRiskScore(score);
    setScreen("results");
  };

  const handleRestart = () => {
    setScreen("landing");
    setRiskScore(0);
  };

  const handleCancel = () => {
    // Stop camera on cancel
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScreen("landing");
  };

  return (
    <main className="min-h-screen">
      {screen === "landing" && (
        <LandingScreen onStart={handleStart} />
      )}
      {screen === "camera" && (
        <CameraScreen 
          onStartScan={handleStartScan} 
          onCancel={handleCancel}
          streamRef={streamRef}
        />
      )}
      {screen === "scanning" && (
        <ScanningScreen 
          onComplete={handleScanComplete} 
          stream={streamRef.current}
        />
      )}
      {screen === "results" && (
        <ResultsScreen score={riskScore} onRestart={handleRestart} />
      )}
    </main>
  );
};

export default Index;
