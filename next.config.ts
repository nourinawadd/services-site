import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    // The root layout sits under the [lang] segment, so the 404 page for
    // unmatched URLs has to be app/global-not-found.tsx.
    globalNotFound: true,
  },
};

export default nextConfig;
