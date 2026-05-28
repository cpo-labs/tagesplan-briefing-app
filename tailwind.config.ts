import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "-apple-system", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      colors: {
        cream: "#FAF7F2",
        "cream-2": "#EFE8DC",
        ink: "#181410",
        "ink-deep": "#0D0B09",
        coral: "#E65042",
        "coral-deep": "#C13B2E",
        petrol: "#1F6E68",
        sand: "#DDA13B",
        sage: "#84996B",
        soft: "#5C544B",
      },
      letterSpacing: {
        tightest: "-.04em",
      },
      borderRadius: {
        lab: "22px",
        "lab-lg": "34px",
      },
    },
  },
  plugins: [],
};

export default config;
