/**
 * Send canvas image data to the backend API for prediction.
 */
export async function predictFromCanvas(
  imageData: ImageData
): Promise<{
  digit: number;
  confidence: number;
  probabilities: number[];
}> {
  // Downsample to 28x28 grayscale, normalized 0-1
  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext("2d")!;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = imageData.width;
  srcCanvas.height = imageData.height;
  const srcCtx = srcCanvas.getContext("2d")!;
  srcCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(srcCanvas, 0, 0, 28, 28);
  const resized = ctx.getImageData(0, 0, 28, 28);

  const grayscale: number[] = [];
  for (let i = 0; i < 28 * 28; i++) {
    grayscale.push(resized.data[i * 4] / 255.0);
  }

  const res = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData: grayscale }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Prediction failed");
  }

  return res.json();
}
