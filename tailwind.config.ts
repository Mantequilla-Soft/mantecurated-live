import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'hive-red': '#E31337',
        'hive-dark': '#1a1a1a',
        'hive-gray': '#2a2a2a',
      },
    },
  },
  plugins: [],
};
export default config;
