'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HealthResponse } from '@/types/api'
import GamePanel from '@/components/GamePanel'
import SocialPanel from '@/components/SocialPanel'
import DePINPanel from '@/components/DePINPanel'
import VericastBadge from '@/components/VericastBadge'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://chainscan.0g.ai'

type TabId = 'game' | 'social' | 'depin'

const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: 'game', label: 'Gaming', desc: 'Real-time state verification' },
  { id: 'social', label: 'SocialFi', desc: 'TEE sybil audit' },
  { id: 'depin', label: 'DePIN', desc: 'Weather sensor pipeline' },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('game')
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [teeCount, setTeeCount] = useState(0)
  const [activityFlash, setActivityFlash] = useState(false)

  useEffect(() => {
    const doPoll = async () => {
      try {
        const resp = await fetch(`${API_BASE}/health`)
        if (!resp.ok) return
        const h: HealthResponse = await resp.json()
        setHealth(h)
        if (h.status === 'healthy') {
          setTeeCount((prev) => prev + 1)
        }
      } catch {
        /* Backend unreachable — degrade gracefully */
      }
    }
    doPoll()
    const interval = setInterval(doPoll, 5000)
    return () => clearInterval(interval)
  }, [])

  const onActivity = useCallback(() => {
    setActivityFlash(true)
    setTimeout(() => setActivityFlash(false), 300)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-vericast-border bg-vericast-panel/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-vericast-accent glow-text">VERICAST</span>
              <span className="text-gray-400 ml-1">OMEGA</span>
            </h1>
            <span className="hidden sm:inline text-xs text-vericast-muted font-mono border border-vericast-border rounded px-2 py-0.5">
              Chain 16661
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-vericast-success shadow-[0_0_6px_rgba(0,255,136,0.6)]' : health ? 'bg-vericast-warning shadow-[0_0_6px_rgba(255,170,0,0.6)]' : 'bg-vericast-muted'}`} />
            <span className="text-xs text-vericast-muted font-mono">
              {health ? health.status.toUpperCase() : 'CONNECTING'}
            </span>
          </div>
        </div>
      </header>

      <nav className="border-b border-vericast-border bg-vericast-bg/80 backdrop-blur sticky top-[52px] z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
            >
              {tab.label}
              <span className="hidden md:inline text-xs text-vericast-muted ml-1">— {tab.desc}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className={activityFlash ? 'opacity-100' : 'opacity-0 transition-opacity duration-100'}>
            <span className="text-xs text-vericast-accent font-mono">Pipeline activity detected</span>
          </div>

          {activeTab === 'game' && (
            <section>
              <h2 className="text-sm font-semibold text-vericast-muted uppercase tracking-wider mb-3">
                Gaming — Verified Tick Pipeline
              </h2>
              <GamePanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} />
            </section>
          )}

          {activeTab === 'social' && (
            <section>
              <h2 className="text-sm font-semibold text-vericast-muted uppercase tracking-wider mb-3">
                SocialFi — Sybil Detection
              </h2>
              <SocialPanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} />
            </section>
          )}

          {activeTab === 'depin' && (
            <section>
              <h2 className="text-sm font-semibold text-vericast-muted uppercase tracking-wider mb-3">
                DePIN — Weather Sensor to Chain
              </h2>
              <DePINPanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} />
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <VericastBadge count={teeCount} health={health} />

          <div className="card space-y-2 text-xs">
            <h4 className="text-vericast-muted uppercase tracking-wider font-semibold">Pipeline</h4>
            <div className="font-mono text-gray-400 leading-relaxed">
              <p>
                <span className="text-vericast-accent">1.</span> Raw data → 0G DA blob
              </p>
              <p>
                <span className="text-vericast-accent">2.</span> Deterministic validation
              </p>
              <p>
                <span className="text-vericast-accent">3.</span> TEE signing (gpt-oss-120b)
              </p>
              <p>
                <span className="text-vericast-accent">4.</span> KV state write
              </p>
              <p>
                <span className="text-vericast-accent">5.</span> On-chain settlement
              </p>
            </div>
          </div>

          <div className="card space-y-1 text-xs">
            <h4 className="text-vericast-muted uppercase tracking-wider font-semibold">0G Components</h4>
            <div className="font-mono space-y-0.5">
              <a href="https://evmrpc.0g.ai" target="_blank" rel="noopener noreferrer" className="block text-vericast-accent hover:underline">
                Chain (EVM 16661)
              </a>
              <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="block text-vericast-accent hover:underline">
                Explorer
              </a>
              <span className="block text-vericast-muted">DA Indexer Turbo</span>
              <span className="block text-vericast-muted">KV Node (PROBED)</span>
              <span className="block text-vericast-muted">TEE Compute</span>
            </div>
          </div>
        </aside>
      </main>

      <footer className="border-t border-vericast-border py-3">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-vericast-muted font-mono">
          VERICAST OMEGA — Unified Verifiable State Layer on 0G | Chain ID 16661 |{' '}
          <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="text-vericast-accent hover:underline">
            chainscan.0g.ai
          </a>
        </div>
      </footer>
    </div>
  )
}
