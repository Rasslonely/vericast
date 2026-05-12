'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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
const PLAYER_SIZE = 16
const MOVE_SPEED = 5
const COLORS = ['#00f0ff', '#b450ff', '#ffaa00', '#ff4466']

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

    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.strokeStyle = '#1e1e3a'
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

    ctx.strokeStyle = '#1e1e3a'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H)

    for (let i = 0; i < players.length; i++) {
      const p = players[i]
      const isSelected = i === selectedRef.current

      ctx.beginPath()
      ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2)
      ctx.fillStyle = p.color + '40'
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(p.x, p.y, PLAYER_SIZE + 6, 0, Math.PI * 2)
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.fillStyle = p.color
      ctx.fillRect(p.x - 6, p.y - 6, 12, 12)

      ctx.fillStyle = '#fff'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(p.id, p.x, p.y - PLAYER_SIZE - 8)

      const barW = 30
      const barH = 4
      ctx.fillStyle = '#1e1e3a'
      ctx.fillRect(p.x - barW / 2, p.y + PLAYER_SIZE + 4, barW, barH)
      ctx.fillStyle = p.health > 50 ? '#00ff88' : p.health > 25 ? '#ffaa00' : '#ff4466'
      ctx.fillRect(p.x - barW / 2, p.y + PLAYER_SIZE + 4, barW * (p.health / 100), barH)
    }

    ctx.fillStyle = '#6a6a8a'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Tick: ${tick}`, 10, 20)
    ctx.fillText(`Match: ${matchId}`, 10, 38)
    ctx.fillText('TAB: switch player | Arrows: move | 1/2: select player', 10, CANVAS_H - 10)
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
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="panel-border w-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn-primary" onClick={submitTick} disabled={submitting}>
          {submitting ? 'Submitting...' : `Submit Tick #${tick + 1}`}
        </button>
        <span className="text-xs text-vericast-muted">
          Selected: <span className="text-vericast-accent font-mono">{players[selectedRef.current]?.id || '---'}</span>
        </span>
        <span className="text-xs text-vericast-muted">
          Pos: ({players[selectedRef.current]?.x},{players[selectedRef.current]?.y})
        </span>
      </div>

      {error && (
        <div className="card border-vericast-danger/30 text-vericast-danger text-xs font-mono break-all">{error}</div>
      )}

      {result && (
        <div className="card space-y-1 text-xs font-mono">
          <div className="text-vericast-success font-semibold">Tick #{tick} verified</div>
          <div>
            <span className="text-vericast-muted">State Root: </span>
            <span className="text-vericast-accent break-all">{result.state_root}</span>
          </div>
          <div>
            <span className="text-vericast-muted">TEE Seal: </span>
            <span className={result.tee_seal ? 'text-vericast-success' : 'text-vericast-warning'}>{result.tee_seal || 'mock_seal'}</span>
          </div>
          {result.explorer_link && (
            <div>
              <span className="text-vericast-muted">Explorer: </span>
              <a href={result.explorer_link} target="_blank" rel="noopener noreferrer" className="text-vericast-accent hover:underline">
                {result.explorer_link}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
