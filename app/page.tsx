"use client";

import { useState, useCallback, useEffect } from "react";
import { UploadSection } from "./components/UploadSection";
import { ContactSection } from "./components/ContactSection";
import { LoadingSection } from "./components/LoadingSection";
import { ResultSection } from "./components/ResultSection";
import { CustomAlert } from "./components/CustomAlert";
import { useClientInfo } from "./hooks/useClientInfo";

export type ViewType = "upload" | "contact" | "loading" | "result";

export interface AnalysisResult {
  isValid: boolean;
  reason?: string;
  figureScore?: number;
  backgroundScore?: number;
  vibeScore?: number;
  figureCritique?: string;
  backgroundCritique?: string;
  vibeCritique?: string;
  finalCritique?: string;
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>("upload");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(
    null
  );
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const clientInfo = useClientInfo();

  const switchView = useCallback((viewId: ViewType) => {
    setCurrentView(viewId);
  }, []);

  const showAlert = useCallback((message: string) => {
    setAlertMessage(message);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertMessage(null);
  }, []);

  const resetApp = useCallback(() => {
    setUploadedImageBase64(null);
    setAnalysisResult(null);
    setCurrentView("upload");
  }, []);

  const resetToUpload = useCallback(() => {
    setCurrentView("upload");
  }, []);

  return (
    <div className="app-wrapper">
      <div className="main-container">
        {/* Upload Section */}
        {currentView === "upload" && (
          <UploadSection
            uploadedImageBase64={uploadedImageBase64}
            setUploadedImageBase64={setUploadedImageBase64}
            switchView={switchView}
            showAlert={showAlert}
          />
        )}

        {/* Contact Section */}
        {currentView === "contact" && (
          <ContactSection
            uploadedImageBase64={uploadedImageBase64}
            clientInfo={clientInfo}
            switchView={switchView}
            setAnalysisResult={setAnalysisResult}
            showAlert={showAlert}
            resetToUpload={resetToUpload}
          />
        )}

        {/* Loading Section */}
        {currentView === "loading" && <LoadingSection />}

        {/* Result Section */}
        {currentView === "result" && analysisResult && (
          <ResultSection
            uploadedImageBase64={uploadedImageBase64}
            analysisResult={analysisResult}
            resetApp={resetApp}
          />
        )}

        {/* Custom Alert Modal */}
        <CustomAlert message={alertMessage} onClose={closeAlert} />
      </div>
    </div>
  );
}
