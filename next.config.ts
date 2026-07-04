import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // pdfjs-dist loads its worker script (pdf.worker.mjs) via a dynamically resolved path,
  // which Vercel's automatic output file tracing doesn't detect — without this, the worker
  // file (and its supporting assets) get left out of the deployed function, crashing with
  // "Cannot find module '.../pdfjs-dist/legacy/build/pdf.worker.mjs'" at runtime.
  outputFileTracingIncludes: {
    "/api/apply/\\[slug\\]": ["./node_modules/pdfjs-dist/**/*"],
  },
};

export default nextConfig;
