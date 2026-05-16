import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'VERICAST OMEGA — Verifiable State Layer',
  description:
    'Unified verifiable state layer on 0G infrastructure — Gaming, SocialFi, DePIN — powered by TEE attestations and DA blobs.',
  keywords: ['0G', 'Vericast', 'TEE', 'DePIN', 'SocialFi', 'Gaming', 'zkVM', 'ERC-7857'],
  openGraph: {
    title: 'VERICAST OMEGA',
    description: 'Verifiable State Layer on 0G Chain',
    type: 'website',
  },
  icons: {
    icon: '/vericast_icon.jpeg',
    shortcut: '/vericast_icon.jpeg',
    apple: '/vericast_icon.jpeg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col font-inter">{children}</body>
    </html>
  )
}
