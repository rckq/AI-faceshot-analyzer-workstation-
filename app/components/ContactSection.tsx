"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { ViewType, AnalysisResult } from "../page";
import { ClientInfo } from "../hooks/useClientInfo";

interface ContactSectionProps {
  uploadedImageBase64: string | null;
  clientInfo: ClientInfo;
  switchView: (view: ViewType) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  showAlert: (message: string) => void;
  resetToUpload: () => void;
}

export function ContactSection({
  uploadedImageBase64,
  clientInfo,
  switchView,
  setAnalysisResult,
  showAlert,
  resetToUpload,
}: ContactSectionProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);

  // 연락처 자동 포맷팅
  const handleContactChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value.replace(/[^0-9]/g, ""); // 숫자만 남기기

      if (value.length >= 3) {
        value = value.substring(0, 3) + "-" + value.substring(3);
      }
      if (value.length >= 8) {
        value = value.substring(0, 8) + "-" + value.substring(8, 12);
      }

      setContact(value);
    },
    []
  );

  // 이름 유효성 검사
  const validateName = useCallback((name: string): boolean => {
    const trimmedName = name.trim();

    // 빈 문자열이거나 공백만 있는 경우
    if (!trimmedName || trimmedName.length < 2) {
      return false;
    }

    // 연속된 공백이 있는지 확인
    if (trimmedName.includes("  ")) {
      return false;
    }

    // 한글, 영문, 공백만 허용, 2-10글자
    const nameRegex = /^[가-힣a-zA-Z\s]{2,10}$/;
    if (!nameRegex.test(trimmedName)) {
      return false;
    }

    // 의성어나 무의미한 패턴 검사
    const invalidPatterns = [
      /^(.)\1+$/, // 같은 글자 반복 (예: 가가가, aaa)
      /^[ㄱ-ㅎㅏ-ㅣ]+$/, // 자음이나 모음만
      /(하{2,}|히{2,}|후{2,}|헤{2,}|호{2,})/, // 하하하, 히히히 등
      /^(하|히|후|헤|호|ㅋ|ㅎ|ㄷ|ㄴ|ㄹ|ㅁ|ㅂ|ㅅ|ㅇ|ㅈ|ㅊ|ㅌ|ㅍ)+$/, // 의성어/자모 반복
      /^[0-9!@#$%^&*()_+=\-\[\]{}|;:,.<>?]+$/, // 숫자나 특수문자만
      /(test|테스트|ㅋㅋ+|ㅎㅎ+|ㄷㄷ|ㄴㄴ)/i, // 테스트/채팅 용어
      /(하히후헤호|아하하하|우하하|으하하)/, // 대표 의성어
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(trimmedName)) {
        return false;
      }
    }

    return true;
  }, []);

  // 연락처 유효성 검사
  const validatePhoneNumber = useCallback((phone: string): boolean => {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  }, []);

  // 폼 제출 처리
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!name || !contact) {
        showAlert("이름과 연락처를 모두 입력해주세요!");
        return;
      }

      if (!validateName(name)) {
        showAlert(
          "올바른 사람 이름을 입력해주세요! 의성어나 무의미한 문자는 사용할 수 없습니다."
        );
        return;
      }

      if (!validatePhoneNumber(contact)) {
        showAlert("연락처는 010-1234-5678 형식으로 입력해주세요!");
        return;
      }

      if (!consent) {
        showAlert("개인정보 수집 및 이용에 동의해주세요.");
        return;
      }

      // 로딩 화면으로 전환
      switchView("loading");

      try {
        // 요청 ID 생성
        const requestId =
          crypto && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        const diagnostics =
          typeof window !== "undefined" &&
          new URL(window.location.href).searchParams.get("diagnostics")
            ? true
            : false;

        const payload = {
          mode: "full",
          requestId,
          name,
          contact,
          timestamp: new Date().toLocaleString("ko-KR"),
          imageBase64: uploadedImageBase64,
          consent: true,
          clientId: clientInfo.clientId,
          visitorId: clientInfo.visitorId,
          ip: clientInfo.ip,
          ua: clientInfo.ua,
          lang: clientInfo.lang,
          referrer: clientInfo.referrer,
          diagnostics,
        };

        // 방법 B: Netlify Functions 사용
        // 로컬(3000)에서는 8888의 Functions로, 배포/프록시 환경에서는 상대 경로 사용
        const endpoint =
          typeof window !== "undefined" && window.location?.port === "3000"
            ? "http://localhost:8888/.netlify/functions/analyzeImage"
            : "/.netlify/functions/analyzeImage";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Server error ${response.status}`);
        }

        const data = await response.json();
        const result = data.result || data;
        if (diagnostics) {
          // 진단용 전체 응답과 validation 상세를 콘솔에 출력
          console.log("[Diagnostics] Raw result:", result);
          if (result.validation) {
            console.log("[Diagnostics] Validation details:", result.validation);
          }
        }

        if (!result.isValid) {
          showAlert(
            result.reason ||
              "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요."
          );
          if (diagnostics && result.validation) {
            console.log("[Diagnostics] Validation details:", result.validation);
          }
          resetToUpload();
          return;
        }

        setAnalysisResult(result);

        // 결과 표시 직후: 시트 로깅을 클라이언트에서 비동기 전송
        try {
          async function createThumbnailDataUrl(
            dataUrl: string,
            maxSize = 256,
            quality = 0.7
          ): Promise<string> {
            return await new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                const scale = Math.min(
                  1,
                  maxSize / Math.max(img.width, img.height)
                );
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("Canvas not supported"));
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", quality));
              };
              img.onerror = reject;
              img.src = dataUrl;
            });
          }

          let imageThumb = "";
          if (uploadedImageBase64) {
            try {
              imageThumb = await createThumbnailDataUrl(
                uploadedImageBase64,
                256,
                0.7
              );
            } catch (_) {}
          }

          const bgPayload: Record<string, any> = {
            action: "complete",
            requestId,
            name,
            contact,
            timestamp: new Date().toLocaleString("ko-KR"),
            image: imageThumb, // 썸네일 전송(용량 절감)
            consent: true,
            clientId: clientInfo.clientId,
            visitorId: clientInfo.visitorId,
            ip: clientInfo.ip,
            ua: clientInfo.ua,
            lang: clientInfo.lang,
            referrer: clientInfo.referrer,
          };
          if (result?.isValid) {
            bgPayload.figureScore = result.figureScore;
            bgPayload.backgroundScore = result.backgroundScore;
            bgPayload.vibeScore = result.vibeScore;
            bgPayload.figureCritique = result.figureCritique;
            bgPayload.backgroundCritique = result.backgroundCritique;
            bgPayload.vibeCritique = result.vibeCritique;
            bgPayload.finalCritique = result.finalCritique;
          }

          const endpoint =
            typeof window !== "undefined" && window.location?.port === "3000"
              ? "http://localhost:8888/.netlify/functions/logToAppsScript-background"
              : "/.netlify/functions/logToAppsScript-background";

          const blob = new Blob([JSON.stringify(bgPayload)], {
            type: "application/json",
          });
          let sent = false;
          try {
            if (navigator.sendBeacon) {
              sent = navigator.sendBeacon(endpoint, blob);
            }
          } catch (_) {}
          if (!sent) {
            fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bgPayload),
              keepalive: true,
            }).catch(() => {});
          }
        } catch (_) {}

        switchView("result");
      } catch (error) {
        console.error("Error during analysis:", error);
        showAlert(
          "분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
        resetToUpload();
      }
    },
    [
      name,
      contact,
      consent,
      uploadedImageBase64,
      clientInfo,
      validateName,
      validatePhoneNumber,
      showAlert,
      switchView,
      setAnalysisResult,
      resetToUpload,
    ]
  );

  return (
    <div className="view-section">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">
          결과를 보기 전, 마지막 단계!
        </h2>
        <p className="text-gray-500 mt-4 text-lg">
          개인정보를 입력해주셔야 결과를 보실 수 있습니다.
          <br />
          결과가 나오기 까지 약 6초가 소요됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-8" noValidate>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (한글/영문만 가능)"
          className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          required
        />

        <input
          type="tel"
          value={contact}
          onChange={handleContactChange}
          placeholder="010-1234-5678"
          maxLength={13}
          className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          required
        />

        <div className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3 border border-gray-200">
          <input
            id="contact-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 text-fuchsia-500 border-gray-300 rounded"
          />
          <label
            htmlFor="contact-consent"
            className="text-gray-700 text-base leading-6"
          >
            개인정보 수집 및 이용에 동의합니다.
            <span className="text-gray-400 text-sm block">
              이름, 연락처, 업로드한 사진은 결과 생성 및 서비스 고도화 목적에만
              사용됩니다.
              <a
                href="/privacy.html"
                target="_blank"
                className="text-fuchsia-600 underline ml-1"
              >
                자세히 보기
              </a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-900 transition-colors text-lg"
        >
          결과 분석 시작하기 🚀
        </button>
      </form>
    </div>
  );
}
