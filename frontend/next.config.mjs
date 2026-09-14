/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "gsap", "@designcodeio/threeui"],
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/i,
      type: "asset/source",
    });

    // Fix Webpack 5 Asset Modules schema mismatch for asset/inline (e.g. data: URLs in @designcodeio/threeui)
    if (config.module.generator?.asset?.filename) {
      if (!config.module.generator["asset/resource"]) {
        config.module.generator["asset/resource"] = config.module.generator.asset;
      }
      delete config.module.generator.asset;
    }

    config.module.generator = config.module.generator || {};
    config.module.generator["asset/inline"] = config.module.generator["asset/inline"] || {};

    return config;
  },
};

export default nextConfig;
