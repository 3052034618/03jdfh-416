/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        horror: {
          bg: "#0a0a0f",
          surface: "#12121a",
          card: "#1a1a25",
          border: "#2d2d3d",
          blood: "#8b0000",
          bloodLight: "#b22222",
          purple: "#2d1b4e",
          purpleLight: "#4a2c7a",
          brown: "#3d2914",
          blue: "#1a2a3a",
          text: "#e0e0e0",
          textMuted: "#888899",
          accent: "#c9a227",
        },
      },
      fontFamily: {
        gothic: ['"Cinzel"', 'serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'flicker': 'flicker 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'blood-drip': 'bloodDrip 2s ease-out forwards',
        'glitch': 'glitch 0.3s ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '75%': { opacity: '0.9' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        bloodDrip: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'candle': '0 0 20px rgba(201, 162, 39, 0.3), 0 0 40px rgba(201, 162, 39, 0.1)',
        'blood': '0 0 15px rgba(139, 0, 0, 0.5)',
        'haunt': '0 4px 30px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
