'use client'

import { useEffect, useState } from 'react'
import type { HealthResponse, DeploymentJSON, VericastBadgeProps } from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://chainscan.0g.ai'

export default function VericastBadge({ count, health }: VericastBadgeProps) {
  const [deployment, setDeployment] = useState<DeploymentJSON | null>(null)
  const [liveCount, setLiveCount] = useState(count)
  const [healthState, setHealthState] = useState<HealthResponse | null>(health)

  useEffect(() => {
    fetch('/deployment.json')
      .then((r) => r.json())
      .then((d: DeploymentJSON) => setDeployment(d))
      .catch(() => {
        /* deployment.json optional at dev time */
      })
  }, [])

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

  const statusColor = healthState?.status === 'healthy' ? 'text-vericast-success' : 'text-vericast-warning'
  const statusGlow = healthState?.status === 'healthy' ? 'shadow-[0_0_12px_rgba(0,255,136,0.3)]' : 'shadow-[0_0_12px_rgba(255,170,0,0.3)]'

  return (
    <div className={`card flex flex-col gap-3 ${statusGlow}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-vericast-muted uppercase tracking-wider">Vericast Badge</h3>
        <span className={`text-xs font-mono font-bold ${statusColor}`}>
          {healthState?.status?.toUpperCase() || '---'}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold font-mono text-vericast-accent glow-text">{liveCount}</span>
        <span className="text-xs text-vericast-muted pb-1">TEE Attestations</span>
      </div>

      <div className="flex gap-2 text-xs font-mono">
        <span className={healthState?.['0g_da'] ? 'text-vericast-success' : 'text-vericast-danger'}>
          ● DA
        </span>
        <span className={healthState?.['0g_kv'] ? 'text-vericast-success' : 'text-vericast-danger'}>
          ● KV
        </span>
        <span className={healthState?.['0g_tee'] ? 'text-vericast-success' : 'text-vericast-danger'}>
          ● TEE
        </span>
      </div>

      {deployment && (
        <div className="border-t border-vericast-border pt-2 mt-1">
          <p className="text-xs text-vericast-muted mb-1">On-Chain Contracts</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(deployment.explorer).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-vericast-accent hover:underline font-mono truncate max-w-[140px]"
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
