'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Wifi, ShieldAlert, Cpu } from 'lucide-react'
import type { SocialAuditResponse, APIError } from '@/types/api'
import { ethers } from 'ethers'
import { useContracts } from '@/hooks/useContracts'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

interface SocialPanelProps {
  api: string
  explorer: string
  onActivity?: () => void
  signer: ethers.Signer | null
}

interface Agent {
  id: string
  name: string
  type: number
  typeLabel: string
  suspicious: boolean
}

const INITIAL_AGENTS: Agent[] = [
  { id: 'agent_1', name: 'Human Observer 1', type: 0, typeLabel: 'Human', suspicious: false },
  { id: 'agent_2', name: 'AI Weather Analyst', type: 1, typeLabel: 'AI', suspicious: false },
  { id: 'agent_3', name: 'AI Feed Monitor', type: 1, typeLabel: 'AI', suspicious: false },
  { id: 'sensor_1', name: 'IoT Sensor HK Central', type: 2, typeLabel: 'IoT', suspicious: false },
]

const SUSPICIOUS_AGENTS: Agent[] = [
  { id: 'bot_1', name: 'SpamBot Alpha', type: 1, typeLabel: 'AI', suspicious: true },
  { id: 'bot_2', name: 'SpamBot Beta', type: 1, typeLabel: 'AI', suspicious: true },
  { id: 'bot_3', name: 'Sybil Bot Gamma', type: 1, typeLabel: 'AI', suspicious: true },
]

const TYPE_BADGES: Record<number, { label: string; color: string; icon: any }> = {
  0: { label: 'Human', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]', icon: User },
  1: { label: 'AI', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]', icon: Bot },
  2: { label: 'IoT', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]', icon: Wifi },
}

function HologramNetwork({ isScanning, hasFlagged }: { isScanning: boolean, hasFlagged: boolean }) {
  const ref = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const count = 400
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI
      const r = Math.random() * 2.5
      const y = (Math.random() - 0.5) * 1.5
      pos[i * 3] = r * Math.cos(theta)
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = r * Math.sin(theta)
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * (isScanning ? 1.5 : 0.1)
      if (isScanning) {
        ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })

  const color = hasFlagged ? "#f43f5e" : "#c084fc" // Rose or Purple

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color={color} size={0.06} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
    </Points>
  )
}

export default function SocialPanel({ api, explorer, onActivity, signer }: SocialPanelProps) {
  const { agentId } = useContracts(signer)
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS)
  const [feedId] = useState('main_feed')
  const [auditing, setAuditing] = useState(false)
  const [result, setResult] = useState<SocialAuditResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [spawnCount, setSpawnCount] = useState(1)

  useEffect(() => {
    const loadAgents = async () => {
      if (!agentId) return
      try {
        const total = await agentId.totalSupply()
        const loaded: Agent[] = []
        for (let i = 1; i <= Number(total); i++) {
          const owner = await agentId.ownerOf(i)
          const data = await agentId.agents(i)
          loaded.push({
            id: `agent_${i}`,
            name: `Agent #${i} (${owner.slice(0,6)}...)`,
            type: Number(data[5]),
            typeLabel: data[5] === 0 ? 'Human' : data[5] === 1 ? 'AI' : 'IoT',
            suspicious: false,
          })
        }
        if (loaded.length > 0) {
          setAgents(loaded)
        }
      } catch (e) {
        console.error('Failed to load agents from contract:', e)
      }
    }
    loadAgents()
  }, [agentId])

  const spawnAgent = () => {
    if (spawnCount > SUSPICIOUS_AGENTS.length) {
      setError('All suspicious agents already spawned')
      return
    }
    const toSpawn = SUSPICIOUS_AGENTS[spawnCount - 1]
    setAgents((prev) => [...prev, { ...toSpawn }])
    setSpawnCount((c) => c + 1)
    setError(null)
  }

  const runAudit = async () => {
    setAuditing(true)
    setError(null)
    setResult(null)
    try {
      const resp = await fetch(`${api}/social/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed_id: feedId }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        const err = data as APIError
        setError(err.message || `HTTP ${resp.status}`)
      } else {
        setResult(data as SocialAuditResponse)
        onActivity?.()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setAuditing(false)
    }
  }

  const hasFlagged = (result?.flagged_agents?.length || 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button 
          className="btn-secondary flex items-center gap-2 border-purple-500/30 text-purple-300 hover:border-purple-400 hover:bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
          onClick={spawnAgent} 
          disabled={spawnCount > SUSPICIOUS_AGENTS.length}
        >
          <span>+ Inject Suspicious Bot ({spawnCount}/{SUSPICIOUS_AGENTS.length})</span>
        </button>
        <button 
          className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]" 
          onClick={runAudit} 
          disabled={auditing}
        >
          {auditing ? <><Cpu size={16} className="animate-spin" /> Deep Scanning...</> : <><ShieldAlert size={16} /> Run TEE Sybil Audit</>}
        </button>
        <div className="px-4 py-2 bg-black/60 border border-purple-500/20 rounded-lg shadow-inner flex items-center backdrop-blur-md">
          <span className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mr-3">Feed Network</span>
          <span className="text-xs text-purple-200 font-mono drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]">{feedId}</span>
        </div>
      </div>

      <div className="glass-panel p-0 relative overflow-hidden min-h-[300px] border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
        {/* 3D Hologram Background */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' }}>
          <Canvas camera={{ position: [0, 0, 4] }}>
            <HologramNetwork isScanning={auditing} hasFlagged={hasFlagged} />
          </Canvas>
        </div>

        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
        <div className={`absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none transition-colors duration-1000 ${hasFlagged ? 'bg-rose-500/20' : 'bg-indigo-500/10'}`} />

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-purple-500/20 pb-4">
            <h4 className="text-xs text-purple-300 uppercase tracking-[0.3em] font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">Agent Registry Matrix</h4>
            <span className="text-xs font-mono font-bold text-purple-200 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]">Total: {agents.length}</span>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {agents.map((a, i) => {
                const badge = TYPE_BADGES[a.type]
                const Icon = badge.icon
                const isFlagged = result?.flagged_agents.includes(a.id)
                
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                    className={`relative flex items-center justify-between p-4 rounded-xl text-xs overflow-hidden transition-all duration-300 backdrop-blur-md ${
                      isFlagged || a.suspicious 
                        ? 'bg-rose-500/10 border border-rose-500/40 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
                        : 'bg-black/40 border border-purple-500/20 hover:border-purple-400/50 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    }`}
                  >
                    {isFlagged && <div className="absolute inset-0 bg-rose-500/20 animate-pulse" />}
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider ${badge.color}`}>
                        <Icon size={14} /> {badge.label}
                      </span>
                      <span className={`font-mono text-sm font-bold tracking-wide ${isFlagged ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'text-slate-200 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]'}`}>{a.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-purple-300/70 relative z-10 tracking-widest">{a.id}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-panel p-4 border-rose-500/30 text-rose-400 text-xs font-mono bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
          >
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`glass-panel p-8 space-y-6 relative overflow-hidden border ${hasFlagged ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]'}`}
          >
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 ${hasFlagged ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            
            <div className="flex items-center gap-3 relative z-10 border-b border-white/5 pb-4">
              <ShieldAlert className={hasFlagged ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]'} size={24} />
              <div className={`text-lg font-display tracking-widest font-bold ${hasFlagged ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}>
                {hasFlagged ? `AUDIT COMPLETE: ${result.flagged_agents.length} BOTS FLAGGED` : 'AUDIT COMPLETE: CLEAN FEED'}
              </div>
            </div>

            {hasFlagged && (
              <div className="space-y-3 bg-rose-950/40 p-4 rounded-xl border border-rose-500/20 relative z-10 shadow-inner">
                <span className="text-[10px] text-rose-300 uppercase tracking-widest font-bold">Flagged Sybil Identities:</span>
                <div className="flex flex-wrap gap-3">
                  {result.flagged_agents.map((id) => (
                    <span key={id} className="px-3 py-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-xs font-mono font-bold border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex flex-col gap-2 p-4 bg-black/40 border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors shadow-inner">
                <span className="text-[10px] text-purple-400 uppercase tracking-[0.2em] font-bold">TEE Seal</span>
                <span className={`text-sm font-mono truncate font-bold ${result.tee_seal && result.tee_seal !== 'mock_seal' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-orange-400'}`}>
                  {result.tee_seal || 'mock_seal'}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-black/40 border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors shadow-inner">
                <span className="text-[10px] text-purple-400 uppercase tracking-[0.2em] font-bold">Proof Settlement</span>
                {(result as any).explorer_link ? (
                  <a href={(result as any).explorer_link} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 font-mono font-bold truncate hover:underline hover:text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]">
                    {(result as any).explorer_link.split('/').pop() || 'View Transaction'}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500 font-mono italic">Pending...</span>
                )}
              </div>
            </div>

            {result.summary && (
              <p className="text-sm text-purple-200 italic bg-purple-950/20 p-4 rounded-xl border border-purple-500/20 leading-relaxed relative z-10 shadow-inner">"{result.summary}"</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
