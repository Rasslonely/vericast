'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ExternalLink, Activity, Database, Fingerprint } from 'lucide-react'
import type { HealthResponse, DeploymentJSON, VericastBadgeProps } from '@/types/api'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://chainscan.0g.ai'

function FloatingCrystal({ isHealthy }: { isHealthy: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.z += delta * 0.2
    }
  })

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={meshRef} scale={1.2}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial 
          color={isHealthy ? "#22d3ee" : "#f59e0b"} 
          envMapIntensity={2} 
          clearcoat={1} 
          clearcoatRoughness={0.1} 
          metalness={0.9} 
          roughness={0.1}
          distort={isHealthy ? 0.1 : 0.4}
          speed={isHealthy ? 2 : 6}
          wireframe={!isHealthy}
        />
      </mesh>
    </Float>
  )
}

export default function VericastBadge({ count, health }: VericastBadgeProps) {
  const [deployment, setDeployment] = useState<DeploymentJSON | null>(null)
  const [liveCount, setLiveCount] = useState(count)
  const [healthState, setHealthState] = useState<HealthResponse | null>(health)
  
  // 3D Tilt Effect
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 })
  const rotateX = useMotionTemplate`${mouseYSpring}deg`
  const rotateY = useMotionTemplate`${mouseXSpring}deg`

  useEffect(() => {
    fetch('/deployment.json')
      .then((r) => r.json())
      .then((d: DeploymentJSON) => setDeployment(d))
      .catch(() => {
        setDeployment({
          contracts: {} as any,
          explorer: {
            "VERI": `${EXPLORER_URL}/address/0x0000000000000000000000000000000000000000`,
            "VericastArbiter": `${EXPLORER_URL}/address/0xF495bc8e6dDeCE3c76eDa91babe88041423d0181`,
            "VericastAgentID": `${EXPLORER_URL}/address/0x12C0da1f898a50A18CeC5aCB83f27c1CcB071aEA`
          }
        } as any)
      })
  }, [])

  useEffect(() => {
    setLiveCount(count)
  }, [count])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE}/health`)
        if (!resp.ok) return
        const h: HealthResponse = await resp.json()
        setHealthState(h)
        if (h.status === 'healthy') {
          setLiveCount((prev) => prev + 1)
        }
      } catch {
        /* backend unreachable — silent degrade */
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct * 15) // Max rotation
    y.set(yPct * -15)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const isHealthy = healthState?.status === 'healthy'

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-full min-h-[420px] h-full rounded-3xl cursor-crosshair perspective-1000 group"
    >
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl backdrop-blur-xl border border-white/10 overflow-hidden shadow-glass transition-all duration-500 ${isHealthy ? 'shadow-[0_0_50px_rgba(34,211,238,0.2)] border-cyan-500/30' : 'shadow-[0_0_50px_rgba(168,85,247,0.2)] border-purple-500/30'}`}
        style={{ transform: "translateZ(0px)" }}
      >
        {/* Animated Background Glow */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-40 transition-colors duration-1000 ${isHealthy ? 'bg-cyan-500' : 'bg-orange-500'}`} />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-30 bg-purple-600 transition-colors duration-1000" />
        
        {/* Scanlines overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDkyNTUsMjU1LDAuMDIpIi8+PC9zdmc+')] opacity-50" />

        {/* 3D Canvas Background */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none group-hover:opacity-80 transition-opacity duration-700">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <Environment preset="city" />
            <FloatingCrystal isHealthy={isHealthy} />
          </Canvas>
        </div>

        <div className="relative h-full p-8 flex flex-col justify-between z-10" style={{ transform: "translateZ(40px)" }}>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <ShieldCheck className={isHealthy ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-orange-400'} size={24} />
              <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] drop-shadow-md">Vericast Badge</h3>
            </div>
            <div className={`flex items-center gap-2 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border transition-colors ${isHealthy ? 'border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'border-orange-500/30'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isHealthy ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]'}`} />
              <span className={`text-[10px] font-mono tracking-widest font-bold ${isHealthy ? 'text-cyan-400' : 'text-orange-400'}`}>
                {healthState?.status?.toUpperCase() || 'PROBING'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-6" style={{ transform: "translateZ(60px)" }}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={liveCount}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="text-7xl font-mono font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                {liveCount}
              </motion.div>
            </AnimatePresence>
            <span className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-[0.3em] mt-4 glow-text bg-black/20 px-4 py-1 rounded-full border border-cyan-500/20 backdrop-blur-sm">TEE Attestations</span>
          </div>

          <div className="flex flex-col gap-4" style={{ transform: "translateZ(30px)" }}>
            <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-inner">
              <span className={`flex items-center gap-2 ${healthState?.['0g_da'] ? 'text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-rose-400'}`}>
                <Database size={12} /> DA
              </span>
              <span className={`flex items-center gap-2 ${healthState?.['0g_kv'] ? 'text-purple-300 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'text-rose-400'}`}>
                <Database size={12} /> KV
              </span>
              <span className={`flex items-center gap-2 ${healthState?.['0g_tee'] ? 'text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-rose-400'}`}>
                <Fingerprint size={12} /> TEE
              </span>
            </div>

            {deployment && (
              <div className="flex justify-between gap-2">
                {Object.entries(deployment.explorer).map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 rounded-lg transition-all duration-300 group hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                  >
                    <span className="text-[9px] text-slate-300 font-mono font-bold truncate mr-2 group-hover:text-cyan-100 transition-colors">{name}</span>
                    <ExternalLink size={12} className="text-cyan-400 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  )
}
