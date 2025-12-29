"use client";

import { useState } from "react";

interface VisionPortalProps {
  imageSrc: string;
  onClose: () => void;
  onAnalyzeComplete: (result: string) => void;
}

export default function VisionPortal({
  imageSrc,
  onClose,
  onAnalyzeComplete,
}: VisionPortalProps) {
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulate AI vision analysis
  const handleAnalyze = async () => {
    setLoading(true);
    setVisionResult(null);

    setTimeout(() => {
      const result =
        "I've confirmed that is a 12kV distribution line. Marking as 'Priority 1 Emergency' for the Winnipeg crew.";
      setVisionResult(result);
      setLoading(false);
      onAnalyzeComplete(result);
    }, 1500); 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">Secure Vision Portal</h2>
        <p className="mb-4">
          Please show the downed line or click the image to simulate analysis.
        </p>

        <img
          src={imageSrc}
          alt="Downed line"
          className="mb-4 w-full rounded border cursor-pointer"
          onClick={handleAnalyze}
        />

        {loading && <p className="mt-2 text-gray-500">Analyzing...</p>}
        {visionResult && <p className="mt-4 font-semibold">{visionResult}</p>}

        <div className="mt-6 flex justify-center gap-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onClose}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
