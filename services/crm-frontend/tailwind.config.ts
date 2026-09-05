import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Open Sans'", 'var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        headline: ["'Urbanist'", 'var(--font-headline)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: '#f9fafb',
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f3f4f6',
        },
        border: {
          DEFAULT: '#e5e7eb',
          strong: '#d1d5db',
        },
        text: {
          primary: '#111827',
          body: '#374151',
          secondary: '#4b5563',
          muted: '#6b7280',
        },
        accent: {
          DEFAULT: '#0f766e',
          hover: '#115e59',
          subtle: '#f0fdfa',
          border: '#99f6e4',
          foreground: '#ffffff',
        },
        status: {
          success: '#15803d',
          'success-bg': '#f0fdf4',
          'success-border': '#bbf7d0',
          warning: '#b45309',
          'warning-bg': '#fffbeb',
          'warning-border': '#fde68a',
          error: '#b91c1c',
          'error-bg': '#fef2f2',
          'error-border': '#fecaca',
          info: '#1d4ed8',
          'info-bg': '#eff6ff',
          'info-border': '#bfdbfe',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;
