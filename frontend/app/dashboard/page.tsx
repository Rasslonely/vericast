'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Radio, Cpu, Network, Database, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { HealthResponse } from '@/types/api'
import GamePanel from '@/components/GamePanel'
import SocialPanel from '@/components/SocialPanel'
import DePINPanel from '@/components/DePINPanel'
import VericastBadge from '@/components/VericastBadge'
import GlobalTerminal from '@/components/GlobalTerminal'
import { useWallet } from '@/hooks/useWallet'
import { useSSE } from '@/hooks/useSSE'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://chainscan.0g.ai'

type TabId = 'game' | 'social' | 'depin'

const TABS: { id: TabId; label: string; desc: string; icon: any }[] = [
  { id: 'game', label: 'Gaming', desc: 'State verification', icon: Cpu },
  { id: 'social', label: 'SocialFi', desc: 'Sybil audit', icon: Network },
  { id: 'depin', label: 'DePIN', desc: 'Sensor pipeline', icon: Radio },
]

export default function Dashboard() {
  const { address, balance, isConnecting, connect } = useWallet()
  const [activeTab, setActiveTab] = useState<TabId>('game')
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [teeCount, setTeeCount] = useState(0)
  const [activityFlash, setActivityFlash] = useState(false)

  const { logs, gameState, socialState, depinState, connected } = useSSE(API_BASE)

  useEffect(() => {
    const doPoll = async () => {
      try {
        const resp = await fetch(`${API_BASE}/health`)
        if (!resp.ok) return
        const h: HealthResponse = await resp.json()
        setHealth(h)
      } catch {
        /* Backend unreachable */
      }
    }
    doPoll()
    const interval = setInterval(doPoll, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (logs.length > 0 && logs[logs.length - 1].source.includes('TEE') && logs[logs.length - 1].level === 'SUCCESS') {
      setTeeCount(prev => prev + 1)
    }
  }, [logs])

  const onActivity = useCallback(() => {
    setActivityFlash(true)
    setTimeout(() => setActivityFlash(false), 500)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative z-0 selection:bg-vericast-accent/30 bg-[#020617] text-slate-200 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <header className="border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-all group mr-2 active:scale-90">
              <ArrowLeft size={18} className="text-slate-400 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-all" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                <img src="/vericast_icon.jpeg" alt="Vericast Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-black tracking-tighter">
                <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">VERICAST</span>
                <span className="text-slate-400 ml-1.5 font-light tracking-widest uppercase">Omega</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'}`} />
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-slate-300">
                {connected ? 'LINK ACTIVE' : 'DISCONNECTED'}
              </span>
            </div>

            <button 
              onClick={connect} 
              disabled={isConnecting}
              className="px-6 py-2 bg-white text-slate-950 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 disabled:opacity-50"
            >
              {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
        <div className="xl:col-span-8 flex flex-col gap-8">
          {/* Floating Pill Tabs */}
          <div className="flex items-center justify-between">
            <nav className="inline-flex p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl flex items-center gap-3 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="dashboard-tab"
                        className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon size={14} className={isActive ? 'text-cyan-400' : ''} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
            
            <div className={`hidden md:flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-cyan-500/80 transition-opacity duration-500 ${activityFlash ? 'opacity-100' : 'opacity-30'}`}>
              <Activity size={14} className="animate-pulse" /> Sub-second Pipeline Active
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1"
            >
              {activeTab === 'game' && <GamePanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} gameState={gameState} />}
              {activeTab === 'social' && <SocialPanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} socialState={socialState} />}
              {activeTab === 'depin' && <DePINPanel api={API_BASE} explorer={EXPLORER_URL} onActivity={onActivity} depinState={depinState} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.aside 
          className="xl:col-span-4 flex flex-col gap-8"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <VericastBadge count={teeCount} health={health} />

          <div className="glass-panel p-8 flex flex-col gap-6 group hover:border-white/20 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-400/10 transition-colors" />
            
            <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" /> 
              Verification Cycle
            </h4>
            
            <div className="space-y-4">
              {[
                { step: 1, text: "Raw data → 0G DA blob", icon: Database },
                { step: 2, text: "Deterministic validation", icon: Activity },
                { step: 3, text: "TEE signing (Hardware Enclave)", icon: Cpu },
                { step: 4, text: "KV state write (Optimistic)", icon: Network },
                { step: 5, text: "On-chain settlement (Final)", icon: ShieldCheck }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/item"
                >
                  <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/item:border-cyan-400/30 group-hover/item:text-cyan-400 transition-all">
                    {item.step}
                  </span>
                  <span className="text-xs font-medium text-slate-400 group-hover/item:text-slate-200 transition-colors">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 flex flex-col gap-6 group hover:border-white/20 transition-all duration-500">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full blur-3xl -mr-16 -mb-16 group-hover:bg-purple-400/10 transition-colors" />
            
            <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" /> 
              0G Infrastructure
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <InfrastructureLink href="https://evmrpc-testnet.0g.ai" label="Chain Node (16602)" status="STABLE" />
              <InfrastructureLink href={EXPLORER_URL} label="Block Explorer" status="LIVE" />
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">DA Indexer Turbo</span>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">READY</span>
              </div>
            </div>
          </div>
        </motion.aside>
      </main>

      <GlobalTerminal api={API_BASE} logs={logs} />
    </div>
  )
}

function InfrastructureLink({ href, label, status }: { href: string; label: string; status: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group/link hover:bg-white/10 hover:border-white/20 transition-all">
      <span className="text-xs font-medium text-slate-400 group-hover/link:text-slate-200 transition-colors">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-cyan-400">{status}</span>
        <ChevronRight size={14} className="text-slate-600 group-hover/link:translate-x-1 transition-all" />
      </div>
    </a>
  )
}
