/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexora: {
          ivory: '#F3F0E9',
          'ivory-soft': '#FAF8F4',
          pine: '#202C2A',
          'pine-deep': '#151E1C',
          'pine-surface': '#293735',
          'pine-border': '#354441',
          sage: '#A9B8A5',
          'sage-soft': '#E6EBE4',
          'sage-dark': '#7A8C76',
          bronze: '#C49A6C',
          'bronze-soft': '#F4ECE1',
          'bronze-dark': '#9A744B',
          charcoal: '#252A30',
          'charcoal-deep': '#191D22',
          'charcoal-surface': '#2D333B',
          'charcoal-border': '#3D444E',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'nexora-card': '0 4px 20px -2px rgba(32, 44, 42, 0.06), 0 2px 6px -1px rgba(32, 44, 42, 0.04)',
        'nexora-glow': '0 0 30px -5px rgba(196, 154, 108, 0.25)',
        'nexora-deep': '0 20px 40px -15px rgba(21, 30, 28, 0.4)',
      }
    },
  },
  plugins: [],
}

