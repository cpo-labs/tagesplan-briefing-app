import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Externalize the libsql native bindings — they cannot be bundled
  serverExternalPackages: ["@libsql/client", "better-auth"],
};

export default config;
