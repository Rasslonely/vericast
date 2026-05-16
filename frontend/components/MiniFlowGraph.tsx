'use client'

import { motion } from 'framer-motion'
import { memo, useMemo } from 'react'

interface Node {
  id: string
  x: number
  y: number
  icon: any
  label: string
  color: string
}

interface Connection {
  from: string
  to: string
}

interface MiniFlowGraphProps {
  nodes: Node[]
  connections: Connection[]
  accentColor: string
}

const MiniFlowGraph = memo(function MiniFlowGraph({ nodes, connections, accentColor }: MiniFlowGraphProps) {
  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full absolute inset-0 z-0 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${accentColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`${accentColor}10`} />
            <stop offset="50%" stopColor={`${accentColor}60`} />
            <stop offset="100%" stopColor={`${accentColor}10`} />
          </linearGradient>
        </defs>
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from)!
          const toNode = nodes.find(n => n.id === conn.to)!
          return (
            <g key={i}>
              <motion.path
                d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.5"
                fill="none"
              />
              <motion.path
                d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                stroke={`url(#grad-${accentColor})`}
                strokeWidth="0.8"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
              />
              <motion.circle
                r="1"
                fill={accentColor}
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "linear" }}
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
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            className="absolute"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {/* The wrapper is now centered on the icon itself */}
            <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center shadow-2xl"
                style={{ borderColor: node.color + '40', boxShadow: `0 0 15px ${node.color}20` }}
              >
                <node.icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: node.color }} />
              </div>
              <span className="absolute top-full mt-3 text-[7px] md:text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                {node.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
})

export default MiniFlowGraph
