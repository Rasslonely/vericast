'use client'

import { motion } from 'framer-motion'
import { Database, Globe, CloudRain, ChevronRight, ArrowLeft, Thermometer, Wind, ShieldCheck, Cpu, Network, Activity } from 'lucide-react'
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

export default function DePINPage() {
  const depinNodes = [
    { id: 'sensor', x: 10, y: 50, icon: Wind, label: 'Physical Sensor', color: '#10b981' },
    { id: 'da', x: 35, y: 50, icon: Database, label: '0G DA (Blob)', color: '#22d3ee' },
    { id: 'tee', x: 65, y: 50, icon: Cpu, label: '0G TEE (Verify)', color: '#c084fc' },
    { id: 'kv', x: 90, y: 50, icon: Network, label: 'Verified State', color: '#10b981' },
  ]

  const depinConns = [
    { from: 'sensor', to: 'da' },
    { from: 'da', to: 'tee' },
    { from: 'tee', to: 'kv' },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-all group mr-2 active:scale-90">
              <ArrowLeft size={18} className="text-slate-400 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <img src="/vericast_icon.jpeg" alt="Vericast Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase font-outfit">DePIN</span>
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
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Autonomous Physical Layer
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-8xl font-black tracking-tighter text-white leading-[0.85]">
              Verifiable <br />
              <span className="text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">Sensor Network</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-slate-400 leading-relaxed max-w-lg">
              DePIN requires trust in the physical world. Vericast Omega ingests telemetry, 
              anchors it in 0G DA, and verifies its integrity via TEE hardware before it touches any contract.
            </motion.p>
            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4">
              <IconBox icon={Thermometer} label="Temp" />
              <IconBox icon={CloudRain} label="Humidity" />
              <IconBox icon={Wind} label="Wind" />
            </motion.div>
          </div>
          
          <motion.div variants={fadeInUp} className="relative h-[400px] rounded-[40px] border border-white/5 bg-white/5 backdrop-blur-3xl p-12 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
             <MiniFlowGraph nodes={depinNodes} connections={depinConns} accentColor="#10b981" />
             
             <div className="absolute bottom-8 right-8 flex items-center gap-2 text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest">
               <Activity size={12} className="animate-pulse" /> Telemetry Stream Verified
             </div>
          </motion.div>
        </section>

        {/* Technical Architecture Flow */}
        <section className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white">Sensor-to-Chain Pipeline</h2>
            <p className="text-slate-400 text-lg">Ensuring data integrity from the physical edge to the blockchain via 0G.</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <ArchitectureStep step="01" title="Data Ingestion" desc="Sensors transmit environmental telemetry to our decentralized ingestion bridge." component="REST / Telemetry" />
             <ArchitectureStep step="02" title="DA Blob Anchor" desc="Telemetry is batched and uploaded to 0G DA, ensuring the raw data is immutable and retrievable." component="0G DA Indexer" />
             <ArchitectureStep step="03" title="Hardware Proof" desc="TEE Enclave performs deterministic validation and signs the telemetry with hardware attestation." component="0G Compute TEE" />
             <ArchitectureStep step="04" title="State Retrieval" desc="The verified environmental state is stored in 0G KV for sub-second access by dApps." component="0G KV Node" />
             <ArchitectureStep step="05" title="Final Settlement" desc="State root and hardware seal are committed to 0G Chain, securing the physical data on-chain." component="0G Chain (EVM)" />
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <BenefitCard icon={ShieldCheck} title="Source Integrity" desc="Verify that sensor data hasn't been tampered with during ingestion through TEE hardware attestation." />
           <BenefitCard icon={Database} title="Blob Storage" desc="Leverage 0G DA for high-volume sensor data that is too expensive to store directly on-chain." />
           <BenefitCard icon={Globe} title="Global Scale" desc="Support millions of distributed sensors through 0G's modular and high-throughput infrastructure." />
        </section>
      </motion.main>
    </div>
  )
}

function IconBox({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center gap-2 group hover:bg-emerald-500/10 transition-colors">
      <Icon size={20} className="text-emerald-400" />
      <span className="text-[10px] text-emerald-300 font-black uppercase tracking-widest">{label}</span>
    </div>
  )
}

function ArchitectureStep({ step, title, desc, component }: { step: string, title: string, desc: string, component: string }) {
  return (
    <motion.div 
      variants={fadeInUp}
      className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col md:flex-row gap-8 items-start group hover:border-emerald-500/30 transition-all duration-500"
    >
      <div className="text-3xl font-black text-slate-700 group-hover:text-emerald-500 transition-colors">{step}</div>
      <div className="flex-1 space-y-3">
        <h4 className="text-white font-bold text-xl uppercase tracking-wider">{title}</h4>
        <p className="text-slate-400 text-lg leading-relaxed">{desc}</p>
      </div>
      <div className="px-6 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest self-start md:self-center">
        {component}
      </div>
    </motion.div>
  )
}

function BenefitCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div variants={fadeInUp} className="p-10 rounded-[40px] bg-white/5 border border-white/5 space-y-6 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 group">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-500">
        <Icon size={32} />
      </div>
      <h4 className="text-2xl font-black text-white">{title}</h4>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}
