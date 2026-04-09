"use client";

import { useState, useCallback } from "react";
import DrawingCanvas from "@/components/DrawingCanvas";
import PredictionDisplay from "@/components/PredictionDisplay";
import { predictFromCanvas } from "@/lib/mnist-model";

export default function Home() {
  const [prediction, setPrediction] = useState<{
    digit: number;
    confidence: number;
    probabilities: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = useCallback(async (imageData: ImageData) => {
    setLoading(true);
    try {
      const result = await predictFromCanvas(imageData);
      setPrediction(result);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="flex-1 flex flex-col">
      <header className="py-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          MNIST 手寫數字辨識
        </h1>
        <p className="mt-3 text-white/50 text-sm md:text-base max-w-md mx-auto">
          在畫板上寫一個 0-9 的數字，AI 模型會即時辨識你的手寫
        </p>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start max-w-3xl w-full">
          <div className="flex flex-col items-center">
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
              畫板
            </h2>
            <DrawingCanvas onPredict={handlePredict} size={280} />
          </div>

          <div className="flex flex-col items-center">
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
              辨識結果
            </h2>
            <div className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              {loading ? (
                <div className="flex items-center justify-center min-h-[320px]">
                  <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                </div>
              ) : (
                <PredictionDisplay
                  digit={prediction?.digit ?? null}
                  confidence={prediction?.confidence ?? 0}
                  probabilities={prediction?.probabilities ?? []}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-white/20 text-xs">
        Powered by ONNX Runtime · 模型在伺服器端運行
      </footer>
    </main>
  );
}
