import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', '"Poppins"', '"Plus Jakarta Sans"', 'sans-serif'],
        headline: ['var(--font-poppins)', '"Poppins"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        wa: {
          light: '#25D366',
          dark: '#128C7E',
          bg: '#ECE5DD'
        }
      }
    },
  },
  plugins: [],
};
export default config;
