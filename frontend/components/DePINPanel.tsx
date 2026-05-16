'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudRain, Wind, Thermometer, Sun, Activity, CheckCircle2, ChevronRight, Globe, Copy } from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DepinState } from '@/hooks/useSSE'

interface DePINPanelProps {
  api: string
  explorer: string
  onActivity?: () => void
  depinState: DepinState | null
}

interface WeatherData {
  temp: number
  humidity: number
  pressure: number
  wind_speed: number
  uvi: number
  timestamp: string
  source: string
}

function WireframeGlobe() {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.5
      ringRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.1} />
        <mesh>
          <sphereGeometry args={[1.75, 32, 32]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.8} />
        </mesh>
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[2.2, 0.01, 16, 100]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </mesh>
      {/* Satellite markers */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[Math.cos(i * 2) * 2, Math.sin(i * 2) * 2, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      ))}
    </group>
  )
}

export default function DePINPanel({ api, explorer, onActivity, depinState }: DePINPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [result, setResult] = useState<DepinState['result'] | null>(null)

  useEffect(() => {
    if (depinState) {
      setResult(depinState.result)
      setWeather({
        temp: 28.5,
        humidity: 72,
        pressure: 1013,
        wind_speed: 4.8,
        uvi: 7.2,
        timestamp: new Date().toISOString(),
        source: 'openweathermap',
      })
      onActivity?.()
    }
  }, [depinState, onActivity])

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-end">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }}>
          <Canvas camera={{ position: [0, 0, 4] }} gl={{ powerPreference: 'low-power' }}>
            <WireframeGlobe />
          </Canvas>
        </div>
        
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4 relative z-10 pt-16">
          <h4 className="text-[10px] text-cyan-400 uppercase tracking-[0.2em] font-semibold flex items-center gap-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            <Globe size={14} className="animate-pulse" /> DePIN 3D Sensor Grid
          </h4>
          <span className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30 text-[10px] font-mono text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
            HK CENTRAL NODE ACTIVE
          </span>
        </div>

        <div className="flex gap-3 flex-wrap relative z-10">
          <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider border bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] glow-text cursor-default">
            <Activity size={16} className="animate-pulse text-cyan-400" />
            ORACLE ACTIVE — Ingesting every 30s
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[180px] border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
          >
            <Activity className="text-cyan-400 animate-pulse" size={32} />
            <div className="text-sm text-cyan-400 font-mono uppercase tracking-widest glow-text">Establishing Telemetry Link...</div>
            <div className="text-xs text-slate-400 font-mono flex items-center justify-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5">
              <span className="text-slate-300">Sensors</span> 
              <ChevronRight size={10} className="text-slate-600" />
              <span className="text-purple-400">0G DA</span> 
              <ChevronRight size={10} className="text-slate-600" />
              <span className="text-emerald-400">TEE Enclave</span> 
              <ChevronRight size={10} className="text-slate-600" />
              <span className="text-cyan-400">0G KV</span>
            </div>
          </motion.div>
        )}

        {weather && result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Telemetry Data Card */}
              <div className="glass-panel p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <h4 className="text-[10px] text-cyan-400 uppercase tracking-[0.2em] font-semibold mb-5 flex items-center justify-between">
                  <span>Environmental Telemetry</span>
                  {weather.source === 'mock' && (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-[9px] border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">MOCK DATA</span>
                  )}
                </h4>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <MetricBadge icon={Thermometer} label="Temp" value={`${weather.temp}°C`} />
                  <MetricBadge icon={CloudRain} label="Humidity" value={`${weather.humidity}%`} />
                  <MetricBadge icon={Wind} label="Wind" value={`${weather.wind_speed} m/s`} />
                  <MetricBadge icon={Sun} label="UV Index" value={`${weather.uvi}`} />
                </div>
              </div>

              {/* Settlement Card */}
              <div className="glass-panel p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="flex items-center gap-2 mb-5 relative z-10">
                  <CheckCircle2 className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={18} />
                  <h4 className="text-xs font-display text-emerald-400 tracking-wide uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">Pipeline Verified</h4>
                </div>

                <div className="space-y-4 font-mono text-xs relative z-10">
                  <div className="flex flex-col gap-1.5 p-3 bg-black/40 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors">
                    <span className="text-[9px] text-cyan-500 uppercase tracking-widest font-semibold flex items-center justify-between">
                      <span>DA Root Hash <ChevronRight size={10} className="inline opacity-50" /></span>
                      <button onClick={() => navigator.clipboard.writeText(result.da_root)} className="text-cyan-500 hover:text-cyan-300 transition-colors" title="Copy DA Root">
                        <Copy size={12} />
                      </button>
                    </span>
                    <span className="text-cyan-300 truncate">{result.da_root}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 p-3 bg-black/40 rounded-lg border border-white/5 hover:border-emerald-500/30 transition-colors">
                    <span className="text-[9px] text-emerald-500 uppercase tracking-widest font-semibold flex items-center justify-between">
                      <span>TEE Cryptographic Seal</span>
                      <button onClick={() => navigator.clipboard.writeText(result.tee_seal || 'mock_seal')} className="text-emerald-500 hover:text-emerald-300 transition-colors" title="Copy TEE Seal">
                        <Copy size={12} />
                      </button>
                    </span>
                    <span className={`truncate ${result.tee_seal && result.tee_seal !== 'mock_seal' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-orange-400'}`}>
                      {result.tee_seal || 'mock_seal'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 p-3 bg-black/40 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
                    <span className="text-[9px] text-purple-400 uppercase tracking-widest font-semibold">
                      On-Chain Settlement
                    </span>
                    {result.explorer_link ? (
                      <a href={result.explorer_link} target="_blank" rel="noopener noreferrer" className="text-purple-300 truncate hover:text-purple-200 hover:underline">
                        {result.explorer_link.split('/').pop() || 'View Transaction'}
                      </a>
                    ) : (
                      <span className="text-slate-500">Pending Blockchain Confirm...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetricBadge({ icon: Icon, label, value }: { icon: any, label: string; value: string }) {
  return (
    <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-xl p-4 border border-white/5 flex flex-col gap-2 group hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]">
      <div className="flex items-center gap-2 text-[10px] text-cyan-500/70 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
        <Icon size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" /> {label}
      </div>
      <div className="text-lg font-mono font-bold text-slate-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{value}</div>
    </div>
  )
}

