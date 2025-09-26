"use client";

export function LoadingSection() {
  return (
    <div className="view-section text-center py-16">
      <div className="bouncing-loader mx-auto">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p className="text-gray-600 font-semibold text-2xl mt-8">
        AI가 당신의 매력을 스캔 중이에요! ✨
      </p>
      <p className="text-gray-400 mt-2 text-lg">
        두근두근... 잠시만 기다려주세요!
      </p>
    </div>
  );
}
