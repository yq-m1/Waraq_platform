/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Noto Naskh Arabic', 'serif'],
      },
      colors: {
        parchment: {
          50: '#fdf8f0',
          100: '#faf0e0',
          200: '#f5e0c0',
          300: '#eecb96',
          400: '#e5af6a',
          500: '#db9248',
          600: '#c87a30',
          700: '#a66228',
          800: '#854e24',
          900: '#6b3e20',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
