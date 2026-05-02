import type { Metadata } from 'next'
import './globals.css'

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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
