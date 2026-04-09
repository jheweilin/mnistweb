"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface DrawingCanvasProps {
  onPredict: (imageData: ImageData) => void;
  size?: number;
}

export default function DrawingCanvas({
  onPredict,
  size = 280,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return ctx;
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, size, size);
    setHasDrawn(false);
  }, [getCtx, size]);

  useEffect(() => {
    clearCanvas();
  }, [clearCanvas]);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = getCtx();
    if (!ctx) return;
    ctx.closePath();

    // Send image data for prediction
    if (hasDrawn) {
      const imageData = ctx.getImageData(0, 0, size, size);
      onPredict(imageData);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {/* Glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity" />
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="relative rounded-2xl border border-white/10 touch-none"
          style={{ width: size, height: size }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/30 text-lg font-medium">
              在此繪製數字
            </p>
          </div>
        )}
      </div>
      <button
        onClick={clearCanvas}
        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white transition-all duration-200 text-sm font-medium backdrop-blur-sm"
      >
        清除畫板
      </button>
    </div>
  );
}
