/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        gcf: {
          50: '#F2F5FD',
          100: '#D5DDF9',
          200: '#BCC9F5',
          300: '#A5B7EF',
          400: '#879EEA',
          500: '#6A87E4', // Azul corporativo principal del logo GCF
          600: '#5271D8',
          700: '#3B56C4',
          800: '#2524CD', // Azul cobalto intenso del vértice del isotipo GCF
          900: '#191B5E',
          950: '#0C0F26',
        },
      },
      boxShadow: {
        'gcf-glow': '0 10px 30px -5px rgba(106, 135, 228, 0.28), 0 4px 12px -2px rgba(37, 36, 205, 0.22)',
      }
    },
  },
  plugins: [],
}
