/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090909',
        'secondary-bg': '#111111',
        card: '#171717',
        'card-elevated': '#202020',
        border: '#303030',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A3A3A3',
        red: {
          50: '#FEF2F2',
          100: '#FECACA',
          200: '#FCA5A5',
          300: '#F87171',
          400: '#EF4444',
          500: '#E53935',
          600: '#DC2626',
          700: '#B91C1C',
          900: '#7F1010',
          950: '#3B0808',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

