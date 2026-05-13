'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Gamepad2, Database, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react'
import type { PlayerState, GameTickResponse, APIError } from '@/types/api'
import { ethers } from 'ethers'
import { useContracts } from '@/hooks/useContracts'

interface GamePanelProps {
  api: string
  explorer: string
  onActivity?: () => void
  signer: ethers.Signer | null
}

const CANVAS_W = 800
const CANVAS_H = 400
const PLAYER_SIZE = 14
const MOVE_SPEED = 5
const COLORS = ['#22d3ee', '#c084fc', '#f59e0b', '#f43f5e']

interface Player {
  id: string
  x: number
  y: number
  color: string
  health: number
}

export default function GamePanel({ api, explorer, onActivity, signer }: GamePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { arbiter } = useContracts(signer)
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', x: 200, y: 200, color: COLORS[0], health: 100 },
    { id: 'p2', x: 400, y: 200, color: COLORS[1], health: 100 },
  ])
  const [tick, setTick] = useState(0)
  const [matchId] = useState(() => `match_${Date.now()}`)
  const [result, setResult] = useState<GameTickResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const keysRef = useRef<Set<string>>(new Set())
  const selectedRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_H)
      ctx.stroke()
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_W, y)
      ctx.stroke()
    }

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H)

    for (let i = 0; i < players.length; i++) {
      const p = players[i]
      const isSelected = i === selectedRef.current

      // Outer glow/radar pulse
      ctx.beginPath()
      ctx.arc(p.x, p.y, PLAYER_SIZE * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = p.color + '15'
      ctx.fill()

      // Selection ring
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, PLAYER_SIZE + 6, 0, Math.PI * 2)
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Core
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.moveTo(p.x, p.y - 8)
      ctx.lineTo(p.x + 8, p.y + 4)
      ctx.lineTo(p.x - 8, p.y + 4)
      ctx.fill()

      // Name
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(p.id.toUpperCase(), p.x, p.y - PLAYER_SIZE - 10)

      // Health
      const barW = 24
      const barH = 3
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(p.x - barW / 2, p.y + PLAYER_SIZE + 6, barW, barH)
      ctx.fillStyle = p.health > 50 ? '#10b981' : p.health > 25 ? '#f59e0b' : '#f43f5e'
      ctx.fillRect(p.x - barW / 2, p.y + PLAYER_SIZE + 6, barW * (p.health / 100), barH)
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`TICK: ${tick}`, 15, 25)
    ctx.fillText(`SESSION: ${matchId}`, 15, 40)
  }, [players, tick, matchId])

  useEffect(() => {
    let animId: number
    const loop = () => {
      const keys = keysRef.current
      if (keys.size > 0) {
        setPlayers((prev) => {
          const next = prev.map((p) => ({ ...p }))
          const sel = next[selectedRef.current]
          if (!sel) return prev
          let dx = 0
          let dy = 0
          if (keys.has('ArrowUp') || keys.has('w')) dy -= MOVE_SPEED
          if (keys.has('ArrowDown') || keys.has('s')) dy += MOVE_SPEED
          if (keys.has('ArrowLeft') || keys.has('a')) dx -= MOVE_SPEED
          if (keys.has('ArrowRight') || keys.has('d')) dx += MOVE_SPEED
          if (dx !== 0 || dy !== 0) {
            sel.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_W - PLAYER_SIZE, sel.x + dx))
            sel.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_H - PLAYER_SIZE, sel.y + dy))
          }
          return next
        })
      }
      draw()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [draw])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (e.key === 'Tab') {
        e.preventDefault()
        selectedRef.current = (selectedRef.current + 1) % players.length
      }
      if (e.key === '1') selectedRef.current = 0
      if (e.key === '2') selectedRef.current = Math.min(1, players.length - 1)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [players.length])

  const submitTick = async () => {
    setSubmitting(true)
    setError(null)
    setResult(null)
    const newTick = tick + 1
    const playerStates: PlayerState[] = players.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      health: p.health,
    }))
    const body = {
      match_id: matchId,
      tick: newTick,
      players: playerStates,
      timestamp: Date.now(),
      object_count: players.length,
    }
    try {
      const resp = await fetch(`${api}/game/submit-tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await resp.json()
      if (!resp.ok) {
        const err = data as APIError
        setError(err.message || `HTTP ${resp.status}`)
      } else {
        const gameResp = data as GameTickResponse
        setResult(gameResp)
        setTick(newTick)
        onActivity?.()

        // Submit on-chain via MetaMask
        if (arbiter && signer) {
          try {
            const streamId = ethers.keccak256(ethers.toUtf8Bytes('vericast_state_v1'))
            const key = ethers.keccak256(ethers.toUtf8Bytes(`match_${matchId}_tick_${newTick}`))
            const root = gameResp.state_root
            const seal = gameResp.tee_seal || ethers.ZeroHash
            const proof = gameResp.da_root || ethers.ZeroHash

            const tx = await arbiter.submitStateRoot(streamId, key, root, seal, proof)
            const receipt = await tx.wait()
            
            // Update result with real tx hash
            setResult({
              ...gameResp,
              explorer_link: `https://chainscan-galileo.0g.ai/tx/${receipt.hash}`,
            })
          } catch (txError: any) {
            console.error('On-chain submission failed:', txError)
            setError(`On-chain settlement failed: ${txError.message || txError}`)
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      
      <div className="glass-panel p-2 relative overflow-hidden group border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)] perspective-1000">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        
        {/* Hologram Projection Container */}
        <div className="relative w-full overflow-hidden flex justify-center items-center py-8" style={{ perspective: "1000px" }}>
          <div 
            className="relative shadow-[0_0_50px_rgba(34,211,238,0.2)] border border-cyan-500/30 rounded-xl bg-black/60 backdrop-blur-sm transition-transform duration-700 ease-out group-hover:rotate-x-[15deg] rotate-x-[25deg]" 
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Scanlines */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMzQsMjExLDIzOCwwLjE1KSIvPjwvc3ZnPg==')] pointer-events-none z-10 opacity-60 rounded-xl mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/10 pointer-events-none z-10 rounded-xl" />
            
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full rounded-xl"
              style={{ maxWidth: '100%', height: 'auto', imageRendering: 'pixelated' }}
            />
          </div>
          
          {/* Projection Base Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-cyan-500/30 blur-2xl rounded-[100%]" />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] text-cyan-400 font-mono font-bold tracking-widest pointer-events-none opacity-80 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
          <span>[TAB] SWITCH / [1,2] SELECT / [ARROWS] MOVE</span>
          <span className="flex items-center gap-2"><Gamepad2 size={14}/> HOLOGRAM ENGINE v2.0</span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 bg-black/40 p-5 rounded-2xl border border-cyan-500/20 shadow-inner">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-vericast-muted uppercase tracking-widest font-semibold">Active Unit</span>
            <span className="text-vericast-accent font-mono text-sm">{players[selectedRef.current]?.id.toUpperCase() || '---'}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-vericast-muted uppercase tracking-widest font-semibold">Coordinates</span>
            <span className="text-slate-300 font-mono text-sm">X:{Math.round(players[selectedRef.current]?.x || 0)} Y:{Math.round(players[selectedRef.current]?.y || 0)}</span>
          </div>
        </div>

        <button className="btn-primary flex items-center gap-2" onClick={submitTick} disabled={submitting}>
          {submitting ? <><Cpu size={16} className="animate-spin" /> Processing...</> : <><Database size={16} /> Submit Tick #{tick + 1}</>}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-panel p-4 border-vericast-danger/30 text-vericast-danger text-xs font-mono bg-vericast-danger/5"
          >
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-panel p-6 space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-vericast-accent/10 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-vericast-success" size={20} />
                <h3 className="text-sm font-display text-vericast-success tracking-wide">TICK #{tick} VERIFIED & SETTLED</h3>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-lg border border-white/5 relative z-10 group">
                <span className="text-[10px] text-vericast-muted uppercase tracking-widest font-semibold flex items-center gap-2">
                  State Root (DA) <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-vericast-accent truncate">{result.state_root}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-lg border border-white/5 relative z-10">
                  <span className="text-[10px] text-vericast-muted uppercase tracking-widest font-semibold flex items-center gap-2">
                    TEE Cryptographic Seal
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
