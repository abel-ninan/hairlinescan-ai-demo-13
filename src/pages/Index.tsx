import { useState, useRef } from "react";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { CaptureScreen, CapturedPhotos } from "@/components/screens/CaptureScreen";
import { ScanningScreen } from "@/components/screens/ScanningScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { QuestionnaireData } from "@/components/Questionnaire";
import { AnalysisResult } from "@/types/analysis";

type AppScreen = "landing" | "capture" | "scanning" | "results";

interface AnalysisData {
  photos: CapturedPhotos;
  questionnaire: QuestionnaireData;
}

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [riskScore, setRiskScore] = useState<number>(0);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStart = () => {
    setScreen("capture");
  };

  const handleAnalyze = (photos: CapturedPhotos, questionnaire: QuestionnaireData) => {
    setAnalysisData({ photos, questionnaire });
    setScreen("scanning");
  };

  const handleScanComplete = (score: number, result?: AnalysisResult) => {
    setRiskScore(score);
    setAnalysisResult(result || null);
    setScreen("results");
  };

  const handleRestart = () => {
    setScreen("landing");
    setRiskScore(0);
    setAnalysisData(null);
    setAnalysisResult(null);
  };

  const handleCancelScanning = () => {
    // Go back to capture screen, keep camera stream alive
    setScreen("capture");
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScreen("landing");
    setAnalysisData(null);
    setAnalysisResult(null);
  };

  return (
    <main className="min-h-screen">
      {screen === "landing" && (
        <LandingScreen onStart={handleStart} />
      )}
      {screen === "capture" && (
        <CaptureScreen 
          onAnalyze={handleAnalyze}
          onCancel={handleCancel}
          streamRef={streamRef}
        />
      )}
      {screen === "scanning" && (
        <ScanningScreen 
          onComplete={handleScanComplete}
          onCancel={handleCancelScanning}
          photos={analysisData?.photos}
          questionnaire={analysisData?.questionnaire}
        />
      )}
      {screen === "results" && (
        <ResultsScreen 
          score={riskScore} 
          analysis={analysisResult}
          onRestart={handleRestart} 
        />
      )}
    </main>
  );
};

export default Index;
