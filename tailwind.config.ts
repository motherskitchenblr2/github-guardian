import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070B14",
        surface: "rgba(15, 23, 42, 0.75)",
        surfaceLight: "rgba(30, 41, 59, 0.7)",
        primary: "#38BDF8",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        accent: "#818CF8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
