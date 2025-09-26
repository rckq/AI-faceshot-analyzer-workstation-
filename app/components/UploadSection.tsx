"use client";

import { useCallback, ChangeEvent } from "react";
import { ViewType } from "../page";

interface UploadSectionProps {
  uploadedImageBase64: string | null;
  setUploadedImageBase64: (image: string | null) => void;
  switchView: (view: ViewType) => void;
  showAlert: (message: string) => void;
}

export function UploadSection({
  uploadedImageBase64,
  setUploadedImageBase64,
  switchView,
  showAlert,
}: UploadSectionProps) {
  const handleImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      async function compressToDataUrl(
        srcFile: File,
        maxSize = 640,
        quality = 0.8
      ): Promise<string> {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const url = URL.createObjectURL(srcFile);
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = url;
        });
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const targetW = Math.round(img.width * scale);
        const targetH = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");
        ctx.drawImage(img, 0, 0, targetW, targetH);
        return canvas.toDataURL("image/jpeg", quality);
      }

      try {
        const dataUrl = await compressToDataUrl(file, 640, 0.8);
        setUploadedImageBase64(dataUrl);
      } catch {
        // 폴백: 원본을 그대로 사용
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImageBase64(result);
        };
        reader.readAsDataURL(file);
      }
    },
    [setUploadedImageBase64]
  );

  const handleNextClick = useCallback(() => {
    if (!uploadedImageBase64) {
      showAlert("먼저 사진을 선택해주세요!");
      return;
    }
    switchView("contact");
  }, [uploadedImageBase64, showAlert, switchView]);

  const handleUploadClick = useCallback(() => {
    document.getElementById("image-upload")?.click();
  }, []);

  return (
    <div className="view-section">
      <div className="text-center">
        <h1 className="main-title font-bold text-gray-800">
          ✨ AI 프로필 사진 분석기 ✨
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          당신의 매력, AI가 찾아드려요!
        </p>
      </div>

      <div className="mt-8">
        <div className="w-full h-64 border-2 border-dashed border-pink-300 rounded-2xl flex items-center justify-center bg-pink-100 bg-opacity-50">
          {uploadedImageBase64 ? (
            <img
              src={uploadedImageBase64}
              alt="Image preview"
              className="max-h-full max-w-full rounded-lg object-cover"
            />
          ) : (
            <div className="text-center text-pink-400">
              <svg
                className="mx-auto h-16 w-16"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
              <p className="mt-2 text-xl">클릭해서 사진 올리기!</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />

        <button
          onClick={handleUploadClick}
          className="w-full bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          앨범에서 사진 선택 💖
        </button>

        {uploadedImageBase64 && (
          <button
            onClick={handleNextClick}
            className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            정보 입력하고 결과보기 ✨
          </button>
        )}
      </div>
    </div>
  );
}
