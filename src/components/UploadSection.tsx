"use client";

import { ChangeEvent } from "react";
import Image from "next/image";

interface UploadSectionProps {
  imageBase64: string | null;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onNextClick: () => void;
  hidden?: boolean;
}

export default function UploadSection({
  imageBase64,
  onImageChange,
  onNextClick,
  hidden = false,
}: UploadSectionProps) {
  return (
    <div className={`view-section ${hidden ? "hidden" : ""}`}>
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          ✨ AI 프로필 사진 분석기 ✨
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          당신의 매력, AI가 찾아드려요!
        </p>
      </div>
      <div className="mt-8">
        <div className="w-full h-64 border-2 border-dashed border-pink-300 rounded-2xl flex items-center justify-center bg-pink-100 bg-opacity-50">
          {imageBase64 ? (
            <Image
              src={imageBase64}
              alt="Image preview"
              width={240}
              height={240}
              className="max-h-full max-w-full rounded-lg object-contain"
              unoptimized={true}
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
          onChange={onImageChange}
        />
        <button
          onClick={() => document.getElementById("image-upload")?.click()}
          className="w-full bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          앨범에서 사진 선택 💖
        </button>
        {imageBase64 && (
          <button
            onClick={onNextClick}
            className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            정보 입력하고 결과보기 ✨
          </button>
        )}
      </div>
    </div>
  );
}
