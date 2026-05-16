'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, ShieldCheck, Database, Cpu, Activity } from 'lucide-react'
import type { LogEntry } from '@/hooks/useSSE'

export default function GlobalTerminal({ api, logs }: { api: string, logs: LogEntry[] }) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getSourceIcon = (source: string) => {
    if (source.includes('DA')) return <Database size={12} className="text-cyan-400" />
    if (source.includes('TEE') || source.includes('ENCLAVE')) return <Cpu size={12} className="text-emerald-400" />
    if (source.includes('CHAIN')) return <ShieldCheck size={12} className="text-purple-400" />
    if (source.includes('GAME') || source.includes('SOCIAL') || source.includes('DEPIN')) return <Activity size={12} className="text-orange-400" />
    return <Terminal size={12} className="text-slate-400" />
  }

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'SUCCESS': return 'text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]'
      case 'ERROR': return 'text-rose-400 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]'
      case 'WARNING': return 'text-orange-400 font-bold drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]'
      default: return 'text-slate-300'
    }
  }

  return (
    <div className="w-full border-t border-vericast-border/50 bg-black/60 backdrop-blur-xl shadow-[0_-10px_40px_rgba(34,211,238,0.05)] overflow-hidden flex flex-col h-56 xl:h-64 relative z-50">
      <div className="px-6 py-2 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={16} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Global Agentic Terminal</span>
          <span className="hidden sm:inline-block px-2 py-0.5 bg-cyan-950/40 border border-cyan-500/20 text-[9px] font-mono text-cyan-500 rounded">OBSERVER MODE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono tracking-widest">LIVE SSE STREAM</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs custom-scrollbar">
        <AnimatePresence initial={false}>
          {logs.length === 0 && (
            <div className="text-slate-500 italic pl-2">Establishing secure Web 4.0 connection... Waiting for autonomous events...</div>
          )}
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4 mb-2 hover:bg-white/5 p-1 rounded transition-colors"
            >
              <span className="text-slate-500 whitespace-nowrap">[{log.timestamp}]</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap w-36 shrink-0">
                {getSourceIcon(log.source)}
                <span className="text-[10px] uppercase text-slate-400 tracking-wider truncate">{log.source}</span>
              </span>
              <span className={`break-words leading-relaxed ${getLevelColor(log.level)}`}>{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
