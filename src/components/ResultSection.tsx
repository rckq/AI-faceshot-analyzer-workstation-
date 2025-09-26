"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/types";

interface ResultSectionProps {
  result: AnalysisResult | null;
  imageBase64: string | null;
  onReset: () => void;
  hidden?: boolean;
}

export default function ResultSection({
  result,
  imageBase64,
  onReset,
  hidden = true,
}: ResultSectionProps) {
  useEffect(() => {
    if (!hidden && result) {
      // 점수 바 애니메이션을 위한 스타일 설정
      const figureBar = document.getElementById("figure-bar");
      const backgroundBar = document.getElementById("background-bar");
      const vibeBar = document.getElementById("vibe-bar");

      if (figureBar)
        figureBar.style.setProperty("--target-width", `${result.figureScore}%`);
      if (backgroundBar)
        backgroundBar.style.setProperty(
          "--target-width",
          `${result.backgroundScore}%`
        );
      if (vibeBar)
        vibeBar.style.setProperty("--target-width", `${result.vibeScore}%`);
    }
  }, [hidden, result]);

  if (!result) return null;

  return (
    <div className={`view-section ${hidden ? "hidden" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">AI 분석 결과!</h2>
        {imageBase64 && (
          <Image
            src={imageBase64}
            alt="Analyzed image"
            width={192}
            height={192}
            className="mt-4 w-48 h-48 mx-auto rounded-full object-cover shadow-2xl border-4 border-white"
            unoptimized={true}
          />
        )}
      </div>

      <div className="mt-8 space-y-6">
        {/* 인물 점수 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-xl text-gray-700">🤵 인물</h3>
            <span className="font-bold text-xl text-fuchsia-500">
              {result.figureScore}점
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5">
            <div
              id="figure-bar"
              className="bg-fuchsia-500 h-5 rounded-full score-bar-fill"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-base text-gray-700 mt-2 p-3 bg-fuchsia-50 rounded-lg">
            {result.figureCritique}
          </p>
        </div>

        {/* 배경 점수 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-xl text-gray-700">🏞️ 배경</h3>
            <span className="font-bold text-xl text-emerald-500">
              {result.backgroundScore}점
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5">
            <div
              id="background-bar"
              className="bg-emerald-500 h-5 rounded-full score-bar-fill"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-base text-gray-700 mt-2 p-3 bg-emerald-50 rounded-lg">
            {result.backgroundCritique}
          </p>
        </div>

        {/* 감성 점수 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-xl text-gray-700">✨ 감성</h3>
            <span className="font-bold text-xl text-amber-500">
              {result.vibeScore}점
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5">
            <div
              id="vibe-bar"
              className="bg-amber-500 h-5 rounded-full score-bar-fill"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-base text-gray-700 mt-2 p-3 bg-amber-50 rounded-lg">
            {result.vibeCritique}
          </p>
        </div>
      </div>

      <div className="mt-8 text-center bg-gray-100 p-4 rounded-xl shadow-inner">
        <h3 className="font-bold text-gray-800 text-lg">AI의 최종 한 줄 평</h3>
        <p className="text-xl mt-2 text-gray-700 italic">
          &ldquo;{result.finalCritique}&rdquo;
        </p>
      </div>

      <div className="mt-8 text-center border-t-2 border-dashed border-pink-200 pt-6">
        <h3 className="text-2xl font-bold text-gray-800">
          베럴댄미 : 남성그루밍 프로필 서비스
        </h3>
        <p className="text-gray-600 mt-2 text-lg">
          인생 프로필 사진, 전문가와 함께!
        </p>
        <div className="flex justify-center space-x-4 mt-4">
          <Link
            href="https://www.instagram.com/better.than.me2040/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-5 rounded-lg hover:shadow-lg transition-shadow text-base"
          >
            인스타그램
          </Link>
          <Link
            href="https://open.kakao.com/o/sDAisnDh"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-400 text-gray-800 py-2 px-5 rounded-lg hover:shadow-lg transition-shadow text-base"
          >
            오픈채팅
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          프로필사진 및 냉정한 외모평가를 원한다면 오픈채팅으로 연락주세요
        </p>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onReset}
          className="w-full bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          다른 사진으로 또 하기! 📸
        </button>
      </div>
    </div>
  );
}
