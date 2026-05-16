'use client'

import { motion } from 'framer-motion'
import { Cpu, Shield, Database, ChevronRight, ArrowLeft, Gamepad2, Zap, CheckCircle2, User, Activity, Network } from 'lucide-react'
import Link from 'next/link'
import MiniFlowGraph from '@/components/MiniFlowGraph'

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } }
}

const fadeInUp: any = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
}

export default function GamingPage() {
  const gamingNodes = [
    { id: 'input', x: 10, y: 50, icon: User, label: 'Player Input', color: '#22d3ee' },
    { id: 'da', x: 30, y: 50, icon: Database, label: '0G DA', color: '#818cf8' },
    { id: 'tee', x: 50, y: 50, icon: Cpu, label: '0G TEE', color: '#c084fc' },
    { id: 'kv', x: 70, y: 50, icon: Network, label: '0G KV', color: '#10b981' },
    { id: 'state', x: 90, y: 50, icon: Shield, label: 'Match State', color: '#f59e0b' },
  ]

  const gamingConns = [
    { from: 'input', to: 'da' },
    { from: 'da', to: 'tee' },
    { from: 'tee', to: 'kv' },
    { from: 'kv', to: 'state' },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-all group mr-2 active:scale-90">
              <ArrowLeft size={18} className="text-slate-400 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-all" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                <img src="/vericast_icon.jpeg" alt="Vericast Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase font-outfit">Gaming</span>
            </div>
          </div>
          <Link href="/dashboard">
            <button className="px-6 py-2 bg-white text-slate-950 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95">
              Launch Dashboard
            </button>
          </Link>
        </div>
      </nav>

      <motion.main 
        variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}
        className="max-w-6xl mx-auto px-6 pt-40 pb-32 space-y-32 relative z-10"
      >
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Autonomous Gaming Layer
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-8xl font-black tracking-tighter text-white leading-[0.85]">
              Provably Fair <br />
              <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">Autonomous Arena</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-slate-400 leading-relaxed max-w-lg">
              Cheating is impossible when logic is hardware-secured. Vericast Omega uses 0G to ensure 
              every state change is immutable, transparent, and instantly verifiable.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex gap-6">
              <Stat label="Avg. Finality" value="<150ms" />
              <Stat label="Throughput" value="1.2k Ticks/s" />
            </motion.div>
          </div>
          
          <motion.div variants={fadeInUp} className="relative h-[400px] rounded-[40px] border border-white/5 bg-white/5 backdrop-blur-3xl p-12 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
             <MiniFlowGraph nodes={gamingNodes} connections={gamingConns} accentColor="#22d3ee" />
             
             <div className="absolute bottom-8 right-8 flex items-center gap-2 text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">
               <Activity size={12} className="animate-pulse" /> Verifiable Pipeline Active
             </div>
          </motion.div>
        </section>

        {/* Technical Architecture Flow */}
        <section className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white">Tick-to-State Pipeline</h2>
            <p className="text-slate-400 text-lg">How we achieve sub-second verifiable gaming states using 0G.</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <ArchitectureStep step="01" title="Data Ingestion" desc="GamePanel captures player vectors and match events, transmitting them to our high-throughput bridge." component="REST / POST" />
             <ArchitectureStep step="02" title="Blob Anchoring" desc="Raw ticks are instantly uploaded to 0G DA Indexer, ensuring permanent data availability for audits." component="0G DA Indexer" />
             <ArchitectureStep step="03" title="TEE Attestation" desc="0G Compute TEE verifies movement logic in a secure enclave, signing the result with a hardware seal." component="0G Compute TEE" />
             <ArchitectureStep step="04" title="Optimistic Update" desc="Verified state root is written to 0G KV for immediate synchronization across all global clients." component="0G KV Node" />
             <ArchitectureStep step="05" title="Settlement" desc="State and seal are committed to 0G Chain, finalizing the tick and enabling reward distribution." component="0G Chain (EVM)" />
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <BenefitCard icon={Shield} title="Anti-Cheat Hardware" desc="Game logic executes in secure enclaves, making memory hacks or injection attacks protocol-impossible." />
           <BenefitCard icon={Zap} title="Sub-second Sync" desc="0G KV allows global clients to stay in perfect sync with the verified game state at near-instant speeds." />
           <BenefitCard icon={Database} title="Auditable History" desc="Every single tick is stored in 0G DA, allowing for full match replays and provable event logs." />
        </section>
      </motion.main>
    </div>
  )
}

function Stat({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{label}</div>
      <div className="text-4xl font-black text-white">{value}</div>
    </div>
  )
}

function ArchitectureStep({ step, title, desc, component }: { step: string, title: string, desc: string, component: string }) {
  return (
    <motion.div 
      variants={fadeInUp}
      className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col md:flex-row gap-8 items-start group hover:border-cyan-500/30 transition-all duration-500"
    >
      <div className="text-3xl font-black text-slate-700 group-hover:text-cyan-500 transition-colors">{step}</div>
      <div className="flex-1 space-y-3">
        <h4 className="text-white font-bold text-xl uppercase tracking-wider">{title}</h4>
        <p className="text-slate-400 text-lg leading-relaxed">{desc}</p>
      </div>
      <div className="px-6 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest self-start md:self-center">
        {component}
      </div>
    </motion.div>
  )
}

function BenefitCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div variants={fadeInUp} className="p-10 rounded-[40px] bg-white/5 border border-white/5 space-y-6 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 group">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-500">
        <Icon size={32} />
      </div>
      <h4 className="text-2xl font-black text-white">{title}</h4>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}
