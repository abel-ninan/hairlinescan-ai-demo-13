import { useState } from "react";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { CameraScreen } from "@/components/screens/CameraScreen";
import { ScanningScreen } from "@/components/screens/ScanningScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";

type AppScreen = "landing" | "camera" | "scanning" | "results";

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [riskScore, setRiskScore] = useState<number>(0);

  const handleStart = () => {
    setScreen("camera");
  };

  const handleCapture = () => {
    setScreen("scanning");
  };

  const handleScanComplete = (score: number) => {
    setRiskScore(score);
    setScreen("results");
  };

  const handleRestart = () => {
    setScreen("landing");
    setRiskScore(0);
  };

  const handleCancel = () => {
    setScreen("landing");
  };

  return (
    <main className="min-h-screen">
      {screen === "landing" && (
        <LandingScreen onStart={handleStart} />
      )}
      {screen === "camera" && (
        <CameraScreen onCapture={handleCapture} onCancel={handleCancel} />
      )}
      {screen === "scanning" && (
        <ScanningScreen onComplete={handleScanComplete} />
      )}
      {screen === "results" && (
        <ResultsScreen score={riskScore} onRestart={handleRestart} />
      )}
    </main>
  );
};

export default Index;
