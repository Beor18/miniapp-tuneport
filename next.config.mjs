import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/config.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: [
      "fuchsia-voiceless-dragonfly-362.mypinata.cloud",
      "ipfs.io",
      "turquoise-neighbouring-mule-736.mypinata.cloud",
    ],
    unoptimized: true,
  },

  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = { fs: false };

    config.ignoreWarnings = [
      { module: /node_modules/ },
      {
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

export default withNextIntl(nextConfig);
