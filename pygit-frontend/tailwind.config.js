/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Surface ramp named by role rather than by shade, so components never
      // hardcode a hex and the whole palette can be retuned in one place.
      colors: {
        canvas: '#0d1117',   // page background
        surface: '#161b22',  // cards, panels, nav, footer
        elevated: '#21262d', // table headers, chips, secondary buttons
        line: '#30363d',     // borders and dividers
        muted: '#8b949e',    // de-emphasised text
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      keyframes: {
        // Modal/backdrop entrance.
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Dropdown panels (branch picker, remote picker).
        popIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Skeleton placeholders while data loads.
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Indeterminate progress bar — a push has no percent-complete signal.
        pushProgress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'scale-in': 'scaleIn 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'popIn 120ms ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
        'push-progress': 'pushProgress 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
