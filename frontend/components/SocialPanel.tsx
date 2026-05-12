'use client'

import { useState, useEffect } from 'react'
import type { SocialAuditResponse, APIError } from '@/types/api'
import { ethers } from 'ethers'
import { useContracts } from '@/hooks/useContracts'

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

const TYPE_BADGES: Record<number, { label: string; color: string }> = {
  0: { label: 'Human', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  1: { label: 'AI', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  2: { label: 'IoT', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

export default function SocialPanel({ api, explorer, onActivity, signer }: SocialPanelProps) {
  const { agentId } = useContracts(signer)
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS)

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
  const [feedId] = useState('main_feed')
  const [auditing, setAuditing] = useState(false)
  const [result, setResult] = useState<SocialAuditResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [spawnCount, setSpawnCount] = useState(1)

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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn-secondary" onClick={spawnAgent} disabled={spawnCount > SUSPICIOUS_AGENTS.length}>
          + Spawn Suspicious Bot ({spawnCount}/{SUSPICIOUS_AGENTS.length})
        </button>
        <button className="btn-primary" onClick={runAudit} disabled={auditing}>
          {auditing ? 'Auditing...' : 'Run TEE Sybil Audit'}
        </button>
        <span className="text-xs text-vericast-muted">Feed: {feedId}</span>
      </div>

      <div className="card">
        <h4 className="text-xs text-vericast-muted uppercase tracking-wider mb-2">Agent Registry ({agents.length})</h4>
        <div className="space-y-1 max-h-[220px] overflow-y-auto">
          {agents.map((a) => {
            const badge = TYPE_BADGES[a.type]
            return (
              <div
                key={a.id}
                className={`flex items-center justify-between p-2 rounded text-xs ${
                  a.suspicious ? 'bg-vericast-danger/10 border border-vericast-danger/20' : 'bg-vericast-bg'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="font-mono text-gray-300">{a.name}</span>
                </div>
                <span className="font-mono text-vericast-muted">{a.id}</span>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="card border-vericast-danger/30 text-vericast-danger text-xs font-mono">{error}</div>
      )}

      {result && (
        <div className="card space-y-2">
          <div className="text-sm font-semibold text-vericast-success">
            {result.flagged_agents.length > 0 ? `Audit: ${result.flagged_agents.length} bots flagged` : 'Audit: Clean feed'}
          </div>
          {result.flagged_agents.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-vericast-muted">Flagged Agents:</span>
              <div className="flex flex-wrap gap-1">
                {result.flagged_agents.map((id) => (
                  <span key={id} className="px-2 py-0.5 bg-vericast-danger/20 text-vericast-danger rounded text-xs font-mono border border-vericast-danger/30">
                    {id} (Sybil)
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs font-mono">
            <span className="text-vericast-muted">TEE Seal: </span>
            <span className={result.tee_seal ? 'text-vericast-success' : 'text-vericast-warning'}>{result.tee_seal || 'mock_seal'}</span>
          </div>
          {result.summary && (
            <p className="text-xs text-vericast-muted italic">{result.summary}</p>
          )}
        </div>
      )}
    </div>
  )
}
