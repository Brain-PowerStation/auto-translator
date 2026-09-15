/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      keyframes: {
        eq1: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
        eq2: {
          '0%, 100%': { height: '100%' },
          '50%': { height: '30%' },
        },
        eq3: {
          '0%, 100%': { height: '40%' },
          '50%': { height: '100%' },
        },
      },
      animation: {
        'eq1': 'eq1 0.7s ease-in-out infinite',
        'eq2': 'eq2 0.6s ease-in-out infinite',
        'eq3': 'eq3 0.8s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
