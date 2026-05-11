/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfd',
          400: '#8193fa',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        gold: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        dark: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
      },
      boxShadow: {
        'glow':       '0 0 20px rgba(99,102,241,0.4)',
        'glow-gold':  '0 0 20px rgba(251,191,36,0.4)',
        'glow-green': '0 0 20px rgba(16,185,129,0.4)',
        'glow-red':   '0 0 20px rgba(244,63,94,0.4)',
        'glass':      '0 8px 32px rgba(0,0,0,0.3)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'ticker':     'ticker 30s linear infinite',
        'fade-in':    'fadeIn 0.4s ease-out',
      },
      keyframes: {
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        ticker:  { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};
