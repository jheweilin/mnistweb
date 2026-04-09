"use client";

interface PredictionDisplayProps {
  digit: number | null;
  confidence: number;
  probabilities: number[];
}

export default function PredictionDisplay({
  digit,
  confidence,
  probabilities,
}: PredictionDisplayProps) {
  if (digit === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px]">
        <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
          <span className="text-4xl text-white/20">?</span>
        </div>
        <p className="text-white/40 text-sm">等待辨識結果...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main prediction */}
      <div className="text-center">
        <p className="text-white/50 text-sm font-medium uppercase tracking-wider mb-2">
          辨識結果
        </p>
        <div className="glow-text text-8xl font-bold text-indigo-400 mb-1">
          {digit}
        </div>
        <p className="text-white/60 text-sm">
          信心度{" "}
          <span className="text-indigo-300 font-semibold">
            {(confidence * 100).toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Probability bars */}
      <div className="w-full max-w-xs space-y-1.5">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">
          各數字機率
        </p>
        {probabilities.map((prob, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`text-xs font-mono w-4 text-right ${
                i === digit ? "text-indigo-300 font-bold" : "text-white/40"
              }`}
            >
              {i}
            </span>
            <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bar-animate transition-all duration-300 ${
                  i === digit
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                    : "bg-white/15"
                }`}
                style={{ width: `${Math.max(prob * 100, 0.5)}%` }}
              />
            </div>
            <span
              className={`text-xs font-mono w-12 text-right ${
                i === digit ? "text-indigo-300" : "text-white/30"
              }`}
            >
              {(prob * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
