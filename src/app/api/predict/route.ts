import { NextRequest, NextResponse } from "next/server";
import * as ort from "onnxruntime-node";
import path from "path";

let session: ort.InferenceSession | null = null;

async function getSession() {
  if (session) return session;
  const modelPath = path.join(process.cwd(), "public", "mnist-12.onnx");
  session = await ort.InferenceSession.create(modelPath);
  return session;
}

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json();

    // imageData is a flat array of grayscale pixel values (28x28), already normalized 0-1
    const input = new Float32Array(imageData);
    if (input.length !== 28 * 28) {
      return NextResponse.json(
        { error: "Invalid image data, expected 784 values" },
        { status: 400 }
      );
    }

    const sess = await getSession();
    const tensor = new ort.Tensor("float32", input, [1, 1, 28, 28]);
    const results = await sess.run({ Input3: tensor });

    const output = results[Object.keys(results)[0]];
    const scores = Array.from(output.data as Float32Array);

    // Softmax
    const maxScore = Math.max(...scores);
    const exps = scores.map((s) => Math.exp(s - maxScore));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probabilities = exps.map((e) => e / sumExps);

    const digit = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[digit];

    return NextResponse.json({ digit, confidence, probabilities });
  } catch (err) {
    console.error("Prediction error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Prediction failed" },
      { status: 500 }
    );
  }
}
