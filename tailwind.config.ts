import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        surface3: "var(--surface3)",
        border: "var(--border)",
        border2: "var(--border2)",
        text: "var(--text)",
        "text-mid": "var(--text-mid)",
        "text-dim": "var(--text-dim)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        bajo: "var(--bajo)",
        medio: "var(--medio)",
        alto: "var(--alto)",
        extremo: "var(--extremo)",
      },
    },
  },
  plugins: [],
};

export default config;
