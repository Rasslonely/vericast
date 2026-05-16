'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Wifi, ShieldAlert, Cpu, Activity, Copy } from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { SocialState } from '@/hooks/useSSE'

interface SocialPanelProps {
  api: string
  explorer: string
  onActivity?: () => void
  socialState: SocialState | null
}

interface Agent {
  id: string
  name: string
  type: number
  typeLabel: string
  suspicious: boolean
}

// Pre-populate agents with both clean + suspicious for demo
const INITIAL_AGENTS: Agent[] = [
  { id: 'agent_1', name: 'Human Observer 1', type: 0, typeLabel: 'Human', suspicious: false },
  { id: 'agent_2', name: 'AI Weather Analyst', type: 1, typeLabel: 'AI', suspicious: false },
  { id: 'agent_3', name: 'AI Feed Monitor', type: 1, typeLabel: 'AI', suspicious: false },
  { id: 'sensor_1', name: 'IoT Sensor HK Central', type: 2, typeLabel: 'IoT', suspicious: false },
  { id: 'bot_1', name: 'SpamBot Alpha', type: 1, typeLabel: 'AI', suspicious: true },
  { id: 'bot_2', name: 'SpamBot Beta', type: 1, typeLabel: 'AI', suspicious: true },
  { id: 'bot_3', name: 'Sybil Bot Gamma', type: 1, typeLabel: 'AI', suspicious: true },
]

const TYPE_BADGES: Record<number, { label: string; color: string; icon: any }> = {
  0: { label: 'Human', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: User },
  1: { label: 'AI', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Bot },
  2: { label: 'IoT', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Wifi },
}

function EnclaveProcessing({ isScanning }: { isScanning: boolean }) {
  const meshRef = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.z += delta * 0.2
    }
  })

  return (
    <group ref={meshRef}>
      <mesh>
        <torusGeometry args={[1.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.01, 16, 100]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function HologramNetwork({ isScanning, hasFlagged }: { isScanning: boolean, hasFlagged: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = 400; const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI; const r = Math.random() * 2.5
      const y = (Math.random() - 0.5) * 1.5
      pos[i * 3] = r * Math.cos(theta); pos[i * 3 + 1] = y; pos[i * 3 + 2] = r * Math.sin(theta)
    }
    return pos
  }, [])
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * (isScanning ? 1.5 : 0.1)
      if (isScanning) ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })
  const color = hasFlagged ? "#f43f5e" : "#c084fc"
  return (
    <group>
      <EnclaveProcessing isScanning={isScanning} />
      <Points ref={ref} positions={positions} stride={3}>
        <PointMaterial transparent color={color} size={0.06} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
      </Points>
    </group>
  )
}

export default function SocialPanel({ api, explorer, onActivity, socialState }: SocialPanelProps) {
  const [agents] = useState<Agent[]>(INITIAL_AGENTS)
  const [feedId] = useState('main_feed')
  const [result, setResult] = useState<SocialState['result'] | null>(null)

  useEffect(() => {
    if (socialState) {
      setResult(socialState.result)
      onActivity?.()
    }
  }, [socialState, onActivity])

  const hasFlagged = (result?.flagged_agents?.length || 0) > 0

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between flex-wrap gap-4 bg-black/40 p-5 rounded-2xl border border-purple-500/20 shadow-inner backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-slate-200">Web 4.0 Active Sentinel</h3>
          <p className="text-xs text-slate-400">Continuous TEE-verified Sybil detection monitoring the feed autonomously. No manual trigger required.</p>
        </div>
        
        <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider border transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-purple-500/20 text-purple-300 border-purple-500/50 glow-text cursor-default">
          <Activity size={16} className="animate-pulse text-purple-400" />
          SENTINEL ACTIVE — Backend Daemon
        </div>
      </div>

      <div className="flex justify-end gap-4 flex-wrap">
        <div className="px-4 py-2 bg-black/60 border border-purple-500/20 rounded-lg shadow-inner flex items-center backdrop-blur-md">
          <span className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mr-3">Feed</span>
          <span className="text-xs text-purple-200 font-mono drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]">{feedId}</span>
        </div>
      </div>

      <div className="glass-panel p-0 relative overflow-hidden min-h-[300px] border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <div className="absolute inset-0 z-0 opacity-50 pointer-events-none" style={{ maskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)' }}>
          <Canvas camera={{ position: [0, 0, 4] }} gl={{ powerPreference: 'low-power' }}>
            <HologramNetwork isScanning={!result} hasFlagged={hasFlagged} />
          </Canvas>
        </div>

        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
        <div className={`absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none transition-colors duration-1000 ${hasFlagged ? 'bg-rose-500/20' : 'bg-indigo-500/10'}`} />

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
               <h4 className="text-xs text-purple-300 uppercase tracking-[0.3em] font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">Agent Registry Matrix</h4>
               {!result && <span className="flex items-center gap-2 text-[10px] text-purple-400 font-mono bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30"><Cpu size={12} className="animate-spin" /> TEE AUDIT PENDING...</span>}
            </div>
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
                    className={`relative flex items-center justify-between p-4 rounded-xl text-xs overflow-hidden transition-all duration-300 backdrop-blur-md ${isFlagged ? 'bg-rose-500/10 border border-rose-500/40 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-black/40 border border-purple-500/20 hover:border-purple-400/50 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]'}`}
                  >
                    {isFlagged && <div className="absolute inset-0 bg-rose-500/20 animate-pulse" />}
                    <div className="flex items-center gap-4 relative z-10">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider ${badge.color}`}><Icon size={14} /> {badge.label}</span>
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
        {result && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`glass-panel p-8 space-y-6 relative overflow-hidden border ${hasFlagged ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]'}`}>
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
                    <span key={id} className="px-3 py-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-xs font-mono font-bold border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]">{id}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2 p-4 bg-black/40 border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors shadow-inner relative z-10">
              <span className="text-[10px] text-purple-400 uppercase tracking-[0.2em] font-bold flex items-center justify-between">
                <span>TEE Cryptographic Proof</span>
                <button onClick={() => navigator.clipboard.writeText(result.tee_seal || 'mock_seal')} className="text-purple-400 hover:text-purple-200 transition-colors" title="Copy TEE Seal">
                  <Copy size={12} />
                </button>
              </span>
              <span className={`text-sm font-mono truncate font-bold ${result.tee_seal && result.tee_seal !== 'mock_seal' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-orange-400'}`}>
                {result.tee_seal || 'mock_seal'}
              </span>
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

