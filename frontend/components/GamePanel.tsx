'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, CheckCircle2, ChevronRight, Activity, Bot, Copy } from 'lucide-react'
import type { GameState } from '@/hooks/useSSE'

interface GamePanelProps {
  api: string
  explorer: string
  onActivity?: () => void
  gameState: GameState | null
}

const CANVAS_W = 800
const CANVAS_H = 400
const PLAYER_SIZE = 14
const COLORS = ['#22d3ee', '#c084fc', '#f59e0b', '#f43f5e']

interface Player {
  id: string
  x: number
  y: number
  color: string
  health: number
  tx: number // target x
  ty: number // target y
}

export default function GamePanel({ api, explorer, onActivity, gameState }: GamePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [players, setPlayers] = useState<Player[]>([
    { id: 'agent_alpha', x: 200, y: 200, tx: 300, ty: 250, color: COLORS[0], health: 100 },
    { id: 'agent_beta', x: 600, y: 200, tx: 500, ty: 150, color: COLORS[1], health: 100 },
  ])
  
  const [tick, setTick] = useState(0)
  const [matchId] = useState(() => `arena_demo`)
  const [result, setResult] = useState<GameState['result'] | null>(null)

  useEffect(() => {
    if (gameState) {
      setTick(gameState.tick)
      setResult(gameState.result)
      setPlayers(prev => 
        gameState.players.map((p, i) => ({
          ...p,
          color: prev[i]?.color || COLORS[i % COLORS.length],
          tx: p.x,
          ty: p.y
        }))
      )
      onActivity?.()
    }
  }, [gameState, onActivity])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Grid lines
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
    }

    // Agent Scan Lines Overlay
    const scanY = (Date.now() / 20) % CANVAS_H
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(CANVAS_W, scanY); ctx.stroke()

    // Border
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H)

    for (let i = 0; i < players.length; i++) {
      const p = players[i]

      // Outer glow/radar pulse
      const pulse = Math.sin(Date.now() / 300) * 5 + 20
      ctx.beginPath()
      ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2)
      ctx.fillStyle = p.color + '10'
      ctx.fill()

      // Target line indicator (Autonomous Intent)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.tx, p.ty)
      ctx.strokeStyle = p.color + '30'
      ctx.setLineDash([2, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // Core (Agent Body)
      ctx.shadowBlur = 10
      ctx.shadowColor = p.color
      ctx.fillStyle = p.color
      ctx.beginPath()
      // Hexagon shape for agent
      for(let side=0; side<7; side++) {
        ctx.lineTo(p.x + 10 * Math.cos(side * 2 * Math.PI / 6 + Date.now()/1000), p.y + 10 * Math.sin(side * 2 * Math.PI / 6 + Date.now()/1000))
      }
      ctx.fill()
      ctx.shadowBlur = 0

      // Thought Process Label
      const thoughts = [
        "SCANNING STATE...", "COMPUTING HASH...", "PROVING TEE...", 
        "SYNCING KV...", "DA OFFLOAD...", "AWAITING TICK..."
      ]
      const currentThought = thoughts[Math.floor((Date.now() + i*1000) / 2000) % thoughts.length]
      
      ctx.fillStyle = p.color
      ctx.font = 'bold 8px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(currentThought, p.x, p.y + PLAYER_SIZE + 20)

      // Name
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(p.id.toUpperCase(), p.x, p.y - PLAYER_SIZE - 12)

      // Health
      const barW = 30
      const barH = 2
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(p.x - barW / 2, p.y + PLAYER_SIZE + 6, barW, barH)
      ctx.fillStyle = p.health > 50 ? '#10b981' : p.health > 25 ? '#f59e0b' : '#f43f5e'
      ctx.fillRect(p.x - barW / 2, p.y + PLAYER_SIZE + 6, barW * (p.health / 100), barH)
    }

    ctx.fillStyle = 'rgba(34, 211, 238, 0.5)'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`TICK: ${tick}`, 15, 25)
    ctx.fillText(`SESSION: ${matchId}`, 15, 40)
  }, [players, tick, matchId])

  useEffect(() => {
    let animId: number
    const loop = () => {
      // Interpolate smoothly towards the target state
      setPlayers((prev) => {
        return prev.map((p) => {
          const dx = p.tx - p.x
          const dy = p.ty - p.y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 1) return p
          
          return { 
            ...p, 
            x: p.x + dx * 0.1, 
            y: p.y + dy * 0.1 
          }
        })
      })
      draw()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [draw])

  return (
    <div className="space-y-6">
      
      <div className="glass-panel p-2 relative overflow-hidden group border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.15)] perspective-1000">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        
        {/* Hologram Projection Container */}
        <div className="relative w-full overflow-hidden flex justify-center items-center py-8" style={{ perspective: "1000px" }}>
          <div className="relative shadow-[0_0_50px_rgba(34,211,238,0.2)] border border-cyan-500/40 rounded-xl bg-black/60 backdrop-blur-md transition-transform duration-700 ease-out group-hover:rotate-x-[15deg] rotate-x-[25deg]" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMzQsMjExLDIzOCwwLjE1KSIvPjwvc3ZnPg==')] pointer-events-none z-10 opacity-60 rounded-xl mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/10 pointer-events-none z-10 rounded-xl" />
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full rounded-xl" style={{ maxWidth: '100%', height: 'auto', imageRendering: 'pixelated' }} />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-cyan-500/30 blur-2xl rounded-[100%]" />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none opacity-90 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="animate-pulse" size={16} />
            <span className="text-[10px] font-mono font-bold tracking-widest">AUTONOMOUS OBSERVER ENGAGED</span>
          </div>
          <span className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono font-bold tracking-widest"><Bot size={14}/> AGENT ARENA v4.0</span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 bg-black/40 p-5 rounded-2xl border border-cyan-500/20 shadow-inner backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-slate-200">Web 4.0 Autonomous Execution</h3>
          <p className="text-xs text-slate-400">Agents navigate the arena independently. State hashes are periodically offloaded to 0G DA and attested by TEE automatically.</p>
        </div>
        
        <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider border bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] glow-text cursor-default">
          <Bot size={16} className="animate-pulse text-cyan-400" />
          AUTONOMOUS MODE — Backend Controlled
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-vericast-accent/10 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-vericast-success" size={20} />
                <h3 className="text-sm font-display text-vericast-success tracking-wide">AUTONOMOUS TICK #{tick} SETTLED</h3>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-lg border border-white/5 relative z-10 group">
                <span className="text-[10px] text-vericast-muted uppercase tracking-widest font-semibold flex items-center justify-between">
                  <span>State Root (DA) <ChevronRight size={10} className="inline opacity-50" /></span>
                  <button onClick={() => navigator.clipboard.writeText(result.state_root)} className="text-vericast-accent hover:text-cyan-300 transition-colors" title="Copy State Root">
                    <Copy size={12} />
                  </button>
                </span>
                <span className="text-vericast-accent truncate">{result.state_root}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-lg border border-white/5 relative z-10">
                  <span className="text-[10px] text-vericast-muted uppercase tracking-widest font-semibold flex items-center justify-between">
                    <span>TEE Cryptographic Seal</span>
                    <button onClick={() => navigator.clipboard.writeText(result.tee_seal || 'mock_seal')} className="text-vericast-muted hover:text-cyan-300 transition-colors" title="Copy TEE Seal">
                      <Copy size={12} />
                    </button>
                  </span>
                  <span className={`truncate ${result.tee_seal && result.tee_seal !== 'mock_seal' ? 'text-vericast-success glow-text' : 'text-vericast-warning'}`}>
                    {result.tee_seal || 'mock_seal'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-lg border border-white/5 relative z-10">
                  <span className="text-[10px] text-vericast-muted uppercase tracking-widest font-semibold">
                    On-Chain Settlement
                  </span>
                  {result.explorer_link ? (
                    <a href={result.explorer_link} target="_blank" rel="noopener noreferrer" className="text-vericast-accent truncate hover:underline">
                      {result.explorer_link.split('/').pop() || 'View TX'}
                    </a>
                  ) : (
                    <span className="text-slate-500">Pending Blockchain Confirm...</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

