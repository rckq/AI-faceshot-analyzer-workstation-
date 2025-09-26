"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Script from "next/script";
import UploadSection from "@/components/UploadSection";
import ContactSection from "@/components/ContactSection";
import LoadingSection from "@/components/LoadingSection";
import ResultSection from "@/components/ResultSection";
import AlertModal from "@/components/AlertModal";
import {
  validateName,
  validatePhoneNumber,
  generateRequestId,
} from "@/lib/validation";
import { collectClientMeta, saveFirstReferrer } from "@/lib/client-utils";
import type {
  ContactFormData,
  AnalysisResult,
  AnalyzeImagePayload,
} from "@/lib/types";

type ViewSection = "upload" | "contact" | "loading" | "result";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewSection>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    contact: "",
    consent: false,
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [alertMessage, setAlertMessage] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [requestId] = useState(() => generateRequestId());

  useEffect(() => {
    // 첫 방문 시 referrer 저장
    saveFirstReferrer();
  }, []);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextClick = () => {
    if (!uploadedImage) {
      showAlert("먼저 사진을 선택해주세요!");
      return;
    }
    setCurrentView("contact");
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev: ContactFormData) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contact) {
      showAlert("이름과 연락처를 모두 입력해주세요!");
      return;
    }

    if (!validateName(formData.name)) {
      showAlert(
        "올바른 사람 이름을 입력해주세요! 의성어나 무의미한 문자는 사용할 수 없습니다."
      );
      return;
    }

    if (!validatePhoneNumber(formData.contact)) {
      showAlert("연락처는 010-1234-5678 형식으로 입력해주세요!");
      return;
    }

    if (!formData.consent) {
      showAlert("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }

    setCurrentView("loading");

    try {
      // 클라이언트 메타 정보 수집
      const clientMeta = await collectClientMeta();

      const payload: AnalyzeImagePayload = {
        mode: "full",
        requestId,
        name: formData.name,
        contact: formData.contact,
        timestamp: new Date().toLocaleString("ko-KR"),
        imageBase64: uploadedImage!,
        consent: formData.consent,
        ...clientMeta,
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();
      const result = data.result || data;

      if (!result.isValid) {
        showAlert(
          result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요."
        );
        resetToUpload();
        return;
      }

      setAnalysisResult(result);
      setCurrentView("result");
    } catch (error) {
      console.error("Error during analysis:", error);
      showAlert("분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      resetToUpload();
    }
  };

  const resetToUpload = () => {
    setCurrentView("upload");
  };

  const resetApp = () => {
    setUploadedImage(null);
    setFormData({ name: "", contact: "", consent: false });
    setAnalysisResult(null);
    setCurrentView("upload");
  };

  return (
    <>
      {/* FingerprintJS 스크립트 */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          const FingerprintJS = (window as any).FingerprintJS;
          if (FingerprintJS) {
            FingerprintJS.load()
              .then((fp: any) => fp.get())
              .then((result: any) => {
                (window as any).__visitorId = result.visitorId;
              })
              .catch(() => {});
          }
        }}
      />

      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl m-4">
        <div className="w-full p-6 bg-white rounded-3xl shadow-2xl relative overflow-hidden">
          <UploadSection
            imageBase64={uploadedImage}
            onImageChange={handleImageChange}
            onNextClick={handleNextClick}
            hidden={currentView !== "upload"}
          />

          <ContactSection
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            hidden={currentView !== "contact"}
          />

          <LoadingSection hidden={currentView !== "loading"} />

          <ResultSection
            result={analysisResult}
            imageBase64={uploadedImage}
            onReset={resetApp}
            hidden={currentView !== "result"}
          />

          <AlertModal
            message={alertMessage}
            isOpen={isAlertOpen}
            onClose={() => setIsAlertOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
