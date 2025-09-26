"use client";

interface CustomAlertProps {
  message: string | null;
  onClose: () => void;
}

export function CustomAlert({ message, onClose }: CustomAlertProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center transform transition-all animate-in zoom-in-75">
        <p className="text-gray-700 text-xl">{message}</p>
        <button
          onClick={onClose}
          className="mt-8 bg-fuchsia-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-fuchsia-600 transition-colors text-lg"
        >
          알겠어요!
        </button>
      </div>
    </div>
  );
}
