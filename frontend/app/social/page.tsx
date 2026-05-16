'use client'

import { motion } from 'framer-motion'
import { Network, ShieldAlert, Cpu, ChevronRight, ArrowLeft, Bot, Zap, Search, Globe, Database, ShieldCheck, Activity } from 'lucide-react'
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

export default function SocialPage() {
  const socialNodes = [
    { id: 'feed', x: 10, y: 50, icon: Globe, label: 'Social Feed', color: '#a855f7' },
    { id: 'tee', x: 35, y: 50, icon: Cpu, label: '0G TEE (Audit)', color: '#c084fc' },
    { id: 'chain', x: 65, y: 50, icon: ShieldCheck, label: '0G Chain (ID)', color: '#818cf8' },
    { id: 'kv', x: 90, y: 50, icon: Network, label: 'Filtered State', color: '#10b981' },
  ]

  const socialConns = [
    { from: 'feed', to: 'tee' },
    { from: 'tee', to: 'chain' },
    { from: 'chain', to: 'kv' },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-purple-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-all group mr-2 active:scale-90">
              <ArrowLeft size={18} className="text-slate-400 group-hover:text-purple-400 group-hover:-translate-x-1 transition-all" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <img src="/vericast_icon.jpeg" alt="Vericast Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase font-outfit">SocialFi</span>
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
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Autonomous Trust Layer
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-8xl font-black tracking-tighter text-white leading-[0.85]">
              Autonomous <br />
              <span className="text-purple-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">Sybil Audit</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-slate-400 leading-relaxed max-w-lg">
              Filtering bot networks with cryptographic certainty. Vericast Omega uses TEE-powered 
              sentinels to autonomously audit social feeds and verify human identity.
            </motion.p>
            <motion.div variants={fadeInUp} className="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-6">
               <ShieldAlert className="text-purple-400" size={40} />
               <div className="space-y-1">
                 <h4 className="text-sm font-black text-white uppercase tracking-widest">Active Sentinel</h4>
                 <p className="text-xs text-purple-300/70">Continuous 0G Compute attestation of feed integrity.</p>
               </div>
            </motion.div>
          </div>
          
          <motion.div variants={fadeInUp} className="relative h-[400px] rounded-[40px] border border-white/5 bg-white/5 backdrop-blur-3xl p-12 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10" />
             <MiniFlowGraph nodes={socialNodes} connections={socialConns} accentColor="#a855f7" />
             
             <div className="absolute bottom-8 right-8 flex items-center gap-2 text-[10px] font-mono text-purple-500/50 uppercase tracking-widest">
               <Activity size={12} className="animate-pulse" /> Sentinel Scan Active
             </div>
          </motion.div>
        </section>

        {/* Technical Architecture Flow */}
        <section className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white">Sybil Audit Pipeline</h2>
            <p className="text-slate-400 text-lg">Autonomous bot detection powered by 0G TEE Hardware.</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <ArchitectureStep step="01" title="Feed Ingestion" desc="Sentinel captures real-time social feed data and metadata for behavioral analysis." component="Backend Stream" />
             <ArchitectureStep step="02" title="TEE Analysis" desc="Data is sent to a Trusted Execution Environment where an audit LLM analyzes patterns." component="0G Compute TEE" />
             <ArchitectureStep step="03" title="Identity Check" desc="Sentinel cross-references agents against the VericastAgentID registry for ERC-7857 validity." component="0G Chain" />
             <ArchitectureStep step="04" title="Sybil Flagging" desc="Suspicious clusters and bot accounts are flagged with a cryptographic seal of proof." component="Hardware Logic" />
             <ArchitectureStep step="05" title="State Commit" desc="Audit results are stored in 0G KV for instant filtering across all integrated SocialFi dApps." component="0G KV Node" />
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <BenefitCard icon={Search} title="Pattern Recognition" desc="Detect sophisticated bot clusters through deep behavioral analysis inside a secure hardware enclave." />
           <BenefitCard icon={Zap} title="Sub-second Audit" desc="Flag malicious actors in milliseconds, allowing platforms to protect their users in real-time." />
           <BenefitCard icon={Cpu} title="TEE Attested" desc="Every audit decision comes with a hardware-signed attestation from the 0G Compute network." />
        </section>
      </motion.main>
    </div>
  )
}

function ArchitectureStep({ step, title, desc, component }: { step: string, title: string, desc: string, component: string }) {
  return (
    <motion.div 
      variants={fadeInUp}
      className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col md:flex-row gap-8 items-start group hover:border-purple-500/30 transition-all duration-500"
    >
      <div className="text-3xl font-black text-slate-700 group-hover:text-purple-500 transition-colors">{step}</div>
      <div className="flex-1 space-y-3">
        <h4 className="text-white font-bold text-xl uppercase tracking-wider">{title}</h4>
        <p className="text-slate-400 text-lg leading-relaxed">{desc}</p>
      </div>
      <div className="px-6 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest self-start md:self-center">
        {component}
      </div>
    </motion.div>
  )
}

function BenefitCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div variants={fadeInUp} className="p-10 rounded-[40px] bg-white/5 border border-white/5 space-y-6 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 group">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 transition-all duration-500">
        <Icon size={32} />
      </div>
      <h4 className="text-2xl font-black text-white">{title}</h4>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}
