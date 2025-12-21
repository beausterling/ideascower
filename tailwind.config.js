import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'tower-black': '#050505',
        'tower-dark': '#0a0a0a',
        'tower-gray': '#1a1a1a',
        'tower-accent': '#ff3e3e', // Red for "bad"
        'tower-accent-dim': '#8a1c1c',
        'tower-neon': '#00ff41', // Matrix green for code/terminal vibes
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        serif: ['"Playfair Display"', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'text-burn': 'textBurn 2.5s ease-in-out forwards',
        'fire-rise': 'fireRise 1.5s ease-in infinite',
        'smoke-rise': 'smokeRise 2s ease-out infinite',
        'smoke-reveal': 'smokeReveal 0.6s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        textBurn: {
          '0%': { 
            color: '#e5e5e5', 
            opacity: '1', 
            filter: 'blur(0px)',
            transform: 'translateY(0) scale(1)'
          },
          '20%': { 
            color: '#ffeb3b', 
            textShadow: '0 0 5px #ff9800', 
            filter: 'blur(0.5px)',
            transform: 'translateY(10px) scale(0.99)'
          }, 
          '40%': { 
            color: '#ff5722', 
            opacity: '0.9', 
            textShadow: '0 0 10px #f44336', 
            filter: 'blur(1px)',
            transform: 'translateY(30px) scale(0.98)' 
          },
          '60%': { 
            color: '#3e2723', 
            opacity: '0.6', 
            textShadow: 'none', 
            filter: 'blur(2px)',
            transform: 'translateY(80px) skewX(2deg)' 
          },
          '80%': { 
            color: '#000000', 
            opacity: '0.2', 
            filter: 'blur(3px)',
            transform: 'translateY(130px) skewX(-2deg)' 
          },
          '100%': { 
            color: 'transparent', 
            opacity: '0', 
            filter: 'blur(4px)',
            transform: 'translateY(180px) scale(0.8)' 
          }
        },
        fireRise: {
          '0%': { transform: 'translateY(120%) scale(1)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(-20%) scale(0.1)', opacity: '0' }
        },
        smokeRise: {
          '0%': {
            transform: 'translateY(100%) scale(1)',
            opacity: '0.7'
          },
          '50%': {
            opacity: '0.4'
          },
          '100%': {
            transform: 'translateY(-120%) scale(1.5)',
            opacity: '0'
          }
        },
        smokeReveal: {
          '0%': {
            opacity: '0',
            filter: 'blur(8px)',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            filter: 'blur(0px)',
            transform: 'translateY(0)'
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}