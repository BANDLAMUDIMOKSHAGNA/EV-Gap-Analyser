import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F9D74",
          dark: "#0B6B50",
          light: "#E6F4EA",
        },
        accent: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
        },
        neutral: {
          text: "#0F172A",
          secondary: "#475569",
          border: "#E2E8F0",
          surface: "#F8FAFC",
        },
        gap: {
          low: "#FEF3C7",
          mid: "#F59E0B",
          high: "#B91C1C",
          served: "#0D9488",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
