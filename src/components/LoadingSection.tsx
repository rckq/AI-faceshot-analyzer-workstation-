interface LoadingSectionProps {
  hidden?: boolean;
}

export default function LoadingSection({ hidden = true }: LoadingSectionProps) {
  return (
    <div className={`view-section text-center py-16 ${hidden ? "hidden" : ""}`}>
      <div className="flex justify-center mx-auto">
        <div className="w-5 h-5 mx-1.5 bg-red-300 rounded-full opacity-100 animate-bouncing-loader" />
        <div className="w-5 h-5 mx-1.5 bg-red-300 rounded-full opacity-100 animate-bouncing-loader [animation-delay:0.2s]" />
        <div className="w-5 h-5 mx-1.5 bg-red-300 rounded-full opacity-100 animate-bouncing-loader [animation-delay:0.4s]" />
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
