import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#04070D",
          900: "#070B14",
          850: "#0B1120",
          800: "#0F172A",
          700: "#1E293B",
          600: "#334155",
          500: "#475569",
        },
        telemetry: {
          solar: "#F59E0B",
          earth: "#38BDF8",
          optimal: "#10B981",
          alert: "#EF4444",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "Menlo", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)",
        "glass-lg": "0 16px 48px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.08)",
        "solar-glow": "0 0 24px -4px rgba(245, 158, 11, 0.5)",
        "earth-glow": "0 0 24px -4px rgba(56, 189, 248, 0.5)",
        "optimal-glow": "0 0 24px -4px rgba(16, 185, 129, 0.5)",
        "telemetry-card": "0 4px 20px -2px rgba(0,0,0,0.6)",
      },
      animation: {
        "orbit": "orbit 20s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
      },
      keyframes: {
        orbit: {
          from: { transform: "rotate(0deg) translateX(120px) rotate(0deg)" },
          to: { transform: "rotate(360deg) translateX(120px) rotate(-360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
