'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Radio, Cpu, Network, Database, ShieldCheck, ChevronRight } from 'lucide-react'
import type { HealthResponse } from '@/types/api'
import GamePanel from '@/components/GamePanel'
import SocialPanel from '@/components/SocialPanel'
import DePINPanel from '@/components/DePINPanel'
import VericastBadge from '@/components/VericastBadge'
import { useWallet } from '@/hooks/useWallet'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://chainscan.0g.ai'

type TabId = 'game' | 'social' | 'depin'

const TABS: { id: TabId; label: string; desc: string; icon: any }[] = [
  { id: 'game', label: 'Gaming', desc: 'State verification', icon: Cpu },
  { id: 'social', label: 'SocialFi', desc: 'Sybil audit', icon: Network },
  { id: 'depin', label: 'DePIN', desc: 'Sensor pipeline', icon: Radio },
]

export default function Dashboard() {
  const { address, balance, isConnecting, connect, signer } = useWallet()
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
    setTimeout(() => setActivityFlash(false), 500)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative z-0 selection:bg-vericast-accent/30">
      <header className="border-b border-vericast-border bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 shadow-glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-vericast-accent glow-text drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">VERICAST</span>
              <span className="text-slate-300 ml-1.5 font-light tracking-widest drop-shadow-md">OMEGA</span>
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#0f172a] border border-white/10 rounded-full shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-vericast-accent shadow-neon-cyan animate-pulse" />
              <span className="text-xs text-cyan-500 font-mono font-bold tracking-widest">Chain 16602</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className={`w-2 h-2 rounded-full transition-all duration-500 ${health?.status === 'healthy' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : health ? 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)]' : 'bg-slate-500'}`} />
              <span className={`text-xs font-mono font-bold tracking-widest ${health?.status === 'healthy' ? 'text-emerald-400' : health ? 'text-orange-400' : 'text-slate-400'}`}>
                {health ? health.status.toUpperCase() : 'PROBING'}
              </span>
            </div>
            <button 
              onClick={connect} 
              disabled={isConnecting}
              className="relative overflow-hidden text-xs font-mono font-bold tracking-widest text-white px-6 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/60 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                {isConnecting ? (
                  <><Activity size={16} className="animate-spin text-cyan-400" /> CONNECTING...</>
                ) : address ? (
                  <>{address.slice(0,6)}...{address.slice(-4)} <span className="text-cyan-500 opacity-70 px-1">|</span> {parseFloat(balance).toFixed(2)} A0GI</>
                ) : (
                  <>CONNECT WALLET</>
                )}
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-vericast-border/50 bg-slate-950/60 backdrop-blur-md sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex gap-2 overflow-x-auto no-scrollbar mask-edges">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2 text-sm font-medium transition-colors duration-300 rounded-full flex items-center gap-2.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={16} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-vericast-accent' : ''}`} />
                <span className="relative z-10 tracking-wide">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden">
        <motion.div 
          className="xl:col-span-8 flex flex-col gap-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between h-6">
            <h2 className="text-xs font-semibold text-vericast-accent uppercase tracking-[0.2em] flex items-center gap-2">
              <ChevronRight size={14} className="opacity-70" />
              {TABS.find(t => t.id === activeTab)?.desc}
            </h2>
            <div className={`flex items-center gap-2 transition-all duration-300 ${activityFlash ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <Activity size={14} className="text-vericast-accent animate-pulse" />
              <span className="text-[10px] text-vericast-accent font-mono uppercase tracking-widest">Pipeline Active</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 relative z-10"
            >
              {activeTab === 'game' && <GamePanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} signer={signer} />}
              {activeTab === 'social' && <SocialPanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} signer={signer} />}
              {activeTab === 'depin' && <DePINPanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.aside 
          className="xl:col-span-4 flex flex-col gap-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <VericastBadge count={teeCount} health={health} />

          <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-vericast-accent2/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
            
            <h4 className="text-[10px] text-vericast-muted uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
              <Database size={12} /> Verification Pipeline
            </h4>
            
            <div className="flex flex-col gap-3 font-mono text-xs text-slate-300">
              {[
                { step: 1, text: "Raw data → 0G DA blob" },
                { step: 2, text: "Deterministic validation" },
                { step: 3, text: "TEE signing (gpt-oss-120b)" },
                { step: 4, text: "KV state write" },
                { step: 5, text: "On-chain settlement" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-start gap-3 p-2 rounded bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-vericast-accent/10 text-vericast-accent border border-vericast-accent/30 text-[10px] flex-shrink-0">
                    {item.step}
                  </span>
                  <span className="leading-5 pt-0.5">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-vericast-accent/5 rounded-full blur-3xl -mr-10 -mb-10 transition-transform duration-700 group-hover:scale-150" />
            
            <h4 className="text-[10px] text-vericast-muted uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
              <ShieldCheck size={12} /> 0G Infrastructure
            </h4>
            
            <div className="flex flex-col gap-2 font-mono text-xs">
              <a href="https://evmrpc-testnet.0g.ai" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-vericast-accent group/link">
                <span>Chain (EVM 16602)</span>
                <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
              </a>
              <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-vericast-accent group/link">
                <span>Block Explorer</span>
                <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
              </a>
              <div className="p-2 text-slate-400">DA Indexer Turbo <span className="float-right text-vericast-success">OK</span></div>
              <div className="p-2 text-slate-400">KV Storage Node <span className="float-right text-vericast-warning">PROBED</span></div>
              <div className="p-2 text-slate-400">TEE Compute Router <span className="float-right text-vericast-success">OK</span></div>
            </div>
          </div>
        </motion.aside>
      </main>
    </div>
  )
}
