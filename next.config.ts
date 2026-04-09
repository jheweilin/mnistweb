import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ["140.134.24.83"],
  serverExternalPackages: ["onnxruntime-node"],
};

export default nextConfig;
