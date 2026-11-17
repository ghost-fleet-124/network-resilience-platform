/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        soc: {
          void: "#050811",
          bg: "#0A1128",
          card: "#0E1A38",
          cardHover: "#13234B",
          border: "#1A2C59",
          borderGlow: "#254182",
          text: "#F1F5F9",
          muted: "#94A3B8",
          subtle: "#64748B",
          cyan: "#00F0FF",
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444",
          violet: "#8B5CF6",
          blue: "#38BDF8",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "Courier New", "monospace"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar": "radar 4s linear infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
      boxShadow: {
        "cyber-cyan": "0 0 15px -3px rgba(0, 240, 255, 0.3)",
        "cyber-red": "0 0 15px -3px rgba(239, 68, 68, 0.4)",
        "cyber-emerald": "0 0 15px -3px rgba(16, 185, 129, 0.3)",
        "soc-panel": "0 4px 20px -2px rgba(5, 8, 17, 0.7), 0 0 0 1px rgba(26, 44, 89, 0.8)",
      },
    },
  },
  plugins: [],
};
