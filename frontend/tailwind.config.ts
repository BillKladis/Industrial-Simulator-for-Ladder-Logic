import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        live: '#22c55e',
        dead: '#64748b',
        rail: '#ef4444',
      },
    },
  },
  plugins: [],
} satisfies Config
