import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Cada idioma vira uma pasta com index.html (/pt-br/, /pt-pt/), servida direto pela Netlify
  trailingSlash: true,
};

export default nextConfig;
