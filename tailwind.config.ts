import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gamja: ['"Gamja Flower"', "cursive"],
      },
      animation: {
        "bouncing-loader": "bouncing-loader 0.8s infinite alternate",
        "fill-bar": "fill-bar 1.5s ease-out forwards",
      },
      keyframes: {
        "bouncing-loader": {
          to: {
            opacity: "0.1",
            transform: "translateY(-16px)",
          },
        },
        "fill-bar": {
          from: { width: "0%" },
          to: { width: "var(--target-width)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
