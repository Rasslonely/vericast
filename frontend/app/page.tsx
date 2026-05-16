'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Cpu, Shield, Zap, Database, ChevronRight, LayoutDashboard, Globe, ArrowRight, Terminal, Activity, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'

export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50])

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <img src="/vericast_icon.jpeg" alt="Vericast Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase">Vericast <span className="font-light text-slate-400">Omega</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <Link href="/architecture" className="hover:text-cyan-400 transition-colors">Architecture</Link>
            <a href="https://docs.0g.ai" target="_blank" className="hover:text-cyan-400 transition-colors">0G Docs</a>
          </div>

          <Link href="/dashboard">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-white text-slate-950 rounded-full font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2"
            >
              Launch App <LayoutDashboard size={16} />
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 flex flex-col items-center text-center">
        <motion.div style={{ opacity, scale, y }} className="max-w-4xl space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest"
          >
            <Zap size={14} className="fill-cyan-400" /> Powered by 0G Infrastructure
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-white"
          >
            Verifiable State <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500">For Autonomous Agents</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            The world's first unified verifiable state layer. <br className="hidden md:block" /> 
            Integrating Gaming, SocialFi, and DePIN into a high-performance 0G-powered autonomous ecosystem.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Link href="/dashboard">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-3 group">
                Enter Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/architecture">
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3">
                Read Manifesto <Globe size={20} className="text-slate-500" />
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Interactive Showcase (The Filled Mockup) */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
          className="mt-24 relative w-full max-w-6xl aspect-video rounded-3xl border border-white/10 bg-[#020617] overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.1)] group"
        >
          <InteractiveShowcase />
          
          <div className="absolute top-0 left-0 p-8 z-20">
            <div className="flex gap-2 items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3">
              <Terminal size={14} className="text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest font-bold animate-pulse">Observation Active</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Manifesto Section */}
      <section id="features" className="py-32 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Why Web 4.0? <br />
                <span className="text-cyan-400">Autonomous & Verifiable.</span>
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Traditional Web3 relies on manual transactions and user-triggered events. 
                Web 4.0 is about **Autonomous Agents** operating on your behalf, 
                where every decision is cryptographically verified by hardware enclaves (TEE) 
                and stored on a high-performance Data Availability (DA) layer.
              </p>
              <div className="space-y-4">
                <ManifestoItem icon={Shield} title="Zero-Trust Verification" desc="State transitions are verified by 0G Compute TEE, ensuring no manipulation." />
                <ManifestoItem icon={Zap} title="High-Performance Storage" desc="Leveraging 0G DA for ultra-fast, cheap data blob storage at scale." />
                <ManifestoItem icon={Database} title="Real-time Retrieval" desc="0G KV allows for sub-second retrieval of autonomous states." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <StatCard label="TEE Attestations" value="10k+" color="text-emerald-400" />
                <StatCard label="DA Blobs Secured" value="4.2TB" color="text-cyan-400" />
              </div>
              <div className="space-y-4">
                <StatCard label="Autonomous Ticks" value="250k" color="text-purple-400" />
                <StatCard label="Response Time" value="~150ms" color="text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-white">Three Core Pillars</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Vericast Omega unifies high-impact sectors into a single verifiable ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PillarCard 
              title="Gaming" 
              icon={Cpu} 
              desc="Provably fair gaming states. Every move is batched to 0G DA and signed by TEE, preventing cheats at the protocol level." 
              accent="cyan"
              href="/gaming"
            />
            <PillarCard 
              title="SocialFi" 
              icon={Zap} 
              desc="Autonomous sybil detection. TEE-powered sentinels audit feeds 24/7 to identify and flag bot networks instantly." 
              accent="purple"
              href="/social"
            />
            <PillarCard 
              title="DePIN" 
              icon={Database} 
              desc="Verifiable physical infrastructure. Ingesting sensor data with cryptographic proof of location and integrity." 
              accent="emerald"
              href="/depin"
            />
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-12 text-center">
          <div className="space-y-4">
             <h4 className="text-3xl font-bold text-white">Ready to witness the future?</h4>
             <p className="text-slate-500">The 0G testnet is active. Experience the autonomous observer now.</p>
          </div>
          
          <Link href="/dashboard">
            <button className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all">
              Launch Dashboard
            </button>
          </Link>

          <div className="flex items-center gap-8 text-slate-500">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function InteractiveShowcase() {
  const [active, setActive] = useState(0)
  
  useEffect(() => {
    const int = setInterval(() => setActive(p => (p + 1) % 3), 4000)
    return () => clearInterval(int)
  }, [])

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-cyan-500/10 pointer-events-none" />
      
      {/* 3D Grid Perspective */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'perspective(1000px) rotateX(60deg) translateY(-200px)' }} />

      <div className="relative w-full h-full flex items-center justify-around px-24">
        <ShowcaseCard 
          active={active === 0} 
          icon={Cpu} 
          color="cyan" 
          title="Gaming" 
          status="Verifying Tick #8291..."
          delay={0}
        />
        <ShowcaseCard 
          active={active === 1} 
          icon={Lock} 
          color="purple" 
          title="Security" 
          status="TEE Seal Generated"
          delay={0.2}
        />
        <ShowcaseCard 
          active={active === 2} 
          icon={Database} 
          color="emerald" 
          title="DePIN" 
          status="DA Batching Success"
          delay={0.4}
        />

        {/* Floating Data Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              initial={{ x: Math.random() * 1000, y: 600, opacity: 0 }}
              animate={{ 
                y: -100, 
                opacity: [0, 1, 0],
                x: (Math.random() - 0.5) * 200 + (Math.random() * 1000)
              }}
              transition={{ 
                duration: 2 + Math.random() * 3, 
                repeat: Infinity,
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ShowcaseCard({ active, icon: Icon, color, title, status, delay }: any) {
  const colors = {
    cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]',
    purple: 'border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: active ? -20 : 0, 
        scale: active ? 1.1 : 1,
        z: active ? 100 : 0
      }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      className={`p-6 rounded-2xl border-2 backdrop-blur-xl ${colors[color as keyof typeof colors]} flex flex-col items-center gap-4 w-56 relative z-20`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
        <Icon size={24} />
      </div>
      <div className="text-center">
        <h4 className="font-black text-white uppercase tracking-wider">{title}</h4>
        <p className="text-[10px] font-mono opacity-70 mt-1 uppercase tracking-widest">{status}</p>
      </div>
      
      {active && (
        <motion.div 
          layoutId="glow"
          className="absolute inset-0 bg-white/20 blur-2xl -z-10 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  )
}

function ManifestoItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
        <Icon size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
      </div>
      <div>
        <h5 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h5>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-2 hover:border-white/10 transition-colors">
      <div className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest">{label}</div>
      <div className={`text-4xl font-black ${color}`}>{value}</div>
    </div>
  )
}

function PillarCard({ title, icon: Icon, desc, accent, href }: { title: string, icon: any, desc: string, accent: string, href: string }) {
  const colors = {
    cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5',
    purple: 'border-purple-500/20 text-purple-400 bg-purple-500/5',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
  }
  
  return (
    <Link href={href} className="block group">
      <div className={`p-8 rounded-3xl border h-full ${colors[accent as keyof typeof colors]} space-y-6 hover:scale-[1.02] transition-transform duration-500`}>
        <Icon size={32} />
        <h4 className="text-2xl font-bold text-white">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
        <div className="pt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-all">
          Learn more <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
