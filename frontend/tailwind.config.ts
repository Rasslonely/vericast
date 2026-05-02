import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vericast: {
          bg: '#0a0a1a',
          panel: '#12122a',
          border: '#1e1e3a',
          accent: '#00f0ff',
          accent2: '#b450ff',
          success: '#00ff88',
          danger: '#ff4466',
          warning: '#ffaa00',
          muted: '#6a6a8a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
