/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bay: {
          deep: '#12233f',
          night: '#1b3358',
          sea: '#2f6f9e',
          sand: '#f6e2ba',
          wood: '#8b5a2b',
          woodlight: '#c08b53',
          gold: '#f6c343',
          golddark: '#c98c14',
          leaf: '#4fa86b',
          coral: '#ff7e6b',
          plum: '#8d7ae6',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', '"Trebuchet MS"', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        chunky: '0 6px 0 rgba(0,0,0,0.28)',
        chunkysm: '0 4px 0 rgba(0,0,0,0.25)',
        glow: '0 0 24px rgba(246,195,67,0.55)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-70px)', opacity: '0' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px) rotate(-2deg)' },
          '40%': { transform: 'translateX(6px) rotate(2deg)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        bob: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wave: {
          '0%,100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-12px)' },
        },
      },
      animation: {
        pop: 'pop 320ms cubic-bezier(0.34,1.56,0.64,1) both',
        floatUp: 'floatUp 1.2s ease-out forwards',
        shake: 'shake 500ms ease-in-out',
        shine: 'shine 2.4s linear infinite',
        bob: 'bob 2.6s ease-in-out infinite',
        wave: 'wave 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
