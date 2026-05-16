'use client'

import { motion } from 'framer-motion'
import { Shield, Database, Cpu, Network, Zap, ChevronRight, ArrowLeft, Terminal, Lock, Globe, Server, Activity } from 'lucide-react'
import Link from 'next/link'
import { memo, useMemo } from 'react'

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-all group active:scale-95">
              <ArrowLeft size={18} className="text-slate-400 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-all" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                <img src="/vericast_icon.jpeg" alt="Vericast Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase font-outfit">Architecture</span>
            </div>
          </div>
          
          <Link href="/dashboard">
            <button className="px-6 py-2 bg-white text-slate-950 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95">
              Launch App
            </button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 space-y-32 relative z-10">
        {/* Header */}
        <section className="space-y-6 text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest"
          >
            System Specification v2.4
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-white"
          >
            Unified Verifiable <br />
            <span className="text-cyan-400">State Architecture</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Explore the neural network of Vericast Omega. A high-performance pipeline where every autonomous 
            decision is anchored in the 0G ecosystem.
          </motion.p>
        </section>

        {/* The Graph Visualizer - Responsive Fixed */}
        <section className="relative h-[400px] md:h-[600px] w-full bg-black/40 rounded-[40px] border border-white/5 overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <ArchitectureGraph />
          
          <div className="absolute bottom-8 left-8 space-y-2 pointer-events-none">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <Activity size={14} className="animate-pulse" /> Live Flow Analysis
            </h3>
            <p className="text-[10px] text-slate-500 max-w-xs">Responsive topological map of verifiable state transitions across the 0G network.</p>
          </div>
        </section>

        {/* 5-Layer Architecture Table */}
        <section className="space-y-12 max-w-5xl mx-auto">
           <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-cyan-400" /> The 5-Layer Stack
          </h2>
          <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400 uppercase text-[10px] tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-6">Layer</th>
                  <th className="px-6 py-6">Component</th>
                  <th className="px-6 py-6">Function</th>
                  <th className="px-6 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <LayerRow id="L1" name="Event Ingestion" component="0G DA" func="Content-addressed immutable storage" status="CONFIRMED" />
                <LayerRow id="L2" name="Verifiable Transform" component="0G Compute TEE" func="Hardware-attested state logic" status="CONFIRMED" />
                <LayerRow id="L3" name="Hot State Query" component="0G KV" func="Sub-second state retrieval" status="CONFIRMED" />
                <LayerRow id="L4" name="Optimistic Settlement" component="0G Chain" func="Transaction finality & Arbiter" status="CONFIRMED" />
                <LayerRow id="L5" name="Unified Identity" component="Agent ID" func="ERC-7857 Intelligent NFT" status="CONFIRMED" />
              </tbody>
            </table>
          </div>
        </section>

        {/* Security Model */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-white flex items-center gap-4">
              <Lock className="text-cyan-400" /> Security Model
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Every state transition in Vericast Omega undergoes a multi-stage validation process. 
              Raw inputs are first anchored in 0G DA to prevent data withholding. 
              The actual computation happens within a Trusted Execution Environment (TEE), 
              which generates a cryptographic seal only if the logic matches the verified source.
            </p>
          </div>
          <div className="space-y-6 pt-4">
             <SecurityFeature icon={Database} title="Cryptographic Pipeline" desc="Raw Input → DA Blob → TEE Sign → KV Write → Chain Settle" color="cyan" />
             <SecurityFeature icon={Zap} title="Dispute Mechanism" desc="VericastArbiter supports optimistic challenges with RISC Zero ZK-Proofs." color="purple" />
             <SecurityFeature icon={Shield} title="Hardware Enclave" desc="Secure computation via TEE ensures no data leakage during inference." color="emerald" />
          </div>
        </section>
      </main>
    </div>
  )
}

// Memoized Graph for performance
const ArchitectureGraph = memo(function ArchitectureGraph() {
  const nodes = useMemo(() => [
    { id: 'fe', x: 15, y: 50, icon: Globe, label: 'Frontend', color: '#22d3ee' },
    { id: 'be', x: 35, y: 50, icon: Server, label: 'FastAPI', color: '#818cf8' },
    { id: 'da', x: 60, y: 25, icon: Database, label: '0G DA', color: '#22d3ee' },
    { id: 'tee', x: 60, y: 50, icon: Cpu, label: '0G TEE', color: '#c084fc' },
    { id: 'kv', x: 60, y: 75, icon: Network, label: '0G KV', color: '#10b981' },
    { id: 'chain', x: 85, y: 50, icon: Shield, label: '0G Chain', color: '#f59e0b' },
  ], [])

  const connections = useMemo(() => [
    { from: 'fe', to: 'be' },
    { from: 'be', to: 'da' },
    { from: 'be', to: 'tee' },
    { from: 'be', to: 'kv' },
    { from: 'da', to: 'chain' },
    { from: 'tee', to: 'chain' },
    { from: 'kv', to: 'chain' },
  ], [])

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full absolute inset-0 z-0 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.1)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.5)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.1)" />
          </linearGradient>
        </defs>
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from)!
          const toNode = nodes.find(n => n.id === conn.to)!
          return (
            <g key={i}>
              <motion.path
                d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="0.5"
                fill="none"
              />
              <motion.path
                d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                stroke="url(#lineGrad)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
              />
              <motion.circle
                r="0.8"
                fill={fromNode.color}
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.6, ease: "linear" }}
                style={{ offsetPath: `path("M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}")`, willChange: 'transform' }}
              />
            </g>
          )
        })}
      </svg>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
            className="absolute"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {/* The wrapper is now centered on the icon itself */}
            <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div 
                className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-black/80 border-2 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                style={{ borderColor: node.color + '40', boxShadow: `0 0 20px ${node.color}20` }}
              >
                <node.icon className="w-6 h-6 md:w-8 md:h-8 pointer-events-auto" style={{ color: node.color }} />
              </div>
              <span className="absolute top-full mt-4 text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap">
                {node.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
})

function SecurityFeature({ icon: Icon, title, desc, color }: any) {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  }
  return (
    <div className={`p-6 rounded-2xl border ${colors[color as keyof typeof colors]} space-y-2 hover:scale-[1.02] transition-transform`}>
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <h4 className="font-bold text-white uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  )
}

function LayerRow({ id, name, component, func, status }: { id: string, name: string, component: string, func: string, status: string }) {
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-6 font-mono text-cyan-400 font-bold group-hover:glow-text">{id}</td>
      <td className="px-6 py-6 font-bold text-white">{name}</td>
      <td className="px-6 py-6 text-slate-400">
        <span className="text-xs font-mono px-2 py-1 rounded bg-white/5 border border-white/10 mr-3 text-slate-300">{component}</span>
        {func}
      </td>
      <td className="px-6 py-6">
        <span className={`text-[9px] font-bold px-3 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>
          {status}
        </span>
      </td>
    </tr>
  )
}
