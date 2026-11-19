import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const CRAFT_SLUGS = [
  "animated-tabs",
  "flip-dot-matrix",
  "paper-form",
  "scratch-card",
  "sparkling-text",
  "spotify-filters",
  "vercel-relative-time-card",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // UI experiments moved from /writing to /craft; keep their old links working.
  async redirects() {
    return CRAFT_SLUGS.map((slug) => ({
      source: `/writing/${slug}`,
      destination: `/craft/${slug}`,
      permanent: true,
    }));
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
