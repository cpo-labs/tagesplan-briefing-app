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
  // Oeffentliche Briefing-Permalinks tragen echte Kalender-/Personendaten
  // ohne Auth. Per HTTP-Header aus dem Suchindex halten — zusaetzlich zum
  // <meta name="robots"> auf der Seite selbst (Belt-and-suspenders, weil
  // manche Crawler nur eins der beiden Signale auswerten).
  async headers() {
    return [
      {
        source: "/briefings/:slug*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default config;
