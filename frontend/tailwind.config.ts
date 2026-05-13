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
          bg: '#020617', // slate-950
          panel: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#22d3ee', // cyan-400
          accent2: '#c084fc', // purple-400
          success: '#10b981', // emerald-500
          danger: '#f43f5e', // rose-500
          warning: '#f59e0b', // amber-500
          muted: '#94a3b8', // slate-400
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'cyber-grid': 'linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'neon-cyan': '0 0 10px rgba(34, 211, 238, 0.4), 0 0 20px rgba(34, 211, 238, 0.2)',
        'neon-purple': '0 0 10px rgba(192, 132, 252, 0.4), 0 0 20px rgba(192, 132, 252, 0.2)',
      }
    },
  },
  plugins: [],
}

export default config
