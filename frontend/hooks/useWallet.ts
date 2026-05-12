'use client'
import { useState, useCallback, useEffect } from 'react'
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers'

const CHAIN_CONFIG = {
  chainId: '0x40DA',  // 16602 testnet
  chainName: '0G Testnet (16602)',
  rpcUrls: ['https://evmrpc-testnet.0g.ai/?chain=16602'],
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
  nativeCurrency: { name: '0G Testnet Token', symbol: 'A0GI', decimals: 18 },
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [isConnecting, setIsConnecting] = useState(false)

  // Listen for chain/account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleChainChanged = () => window.location.reload()
      const handleAccountsChanged = () => window.location.reload()
      
      ;(window as any).ethereum.on('chainChanged', handleChainChanged)
      ;(window as any).ethereum.on('accountsChanged', handleAccountsChanged)
      
      return () => {
        ;(window as any).ethereum.removeListener('chainChanged', handleChainChanged)
        ;(window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (typeof (window as any).ethereum === 'undefined') {
      alert('Please install MetaMask')
      return
    }
    setIsConnecting(true)
    try {
      const p = new BrowserProvider((window as any).ethereum)
      await p.send('eth_requestAccounts', [])

      // Switch to 0G network
      try {
        await p.send('wallet_switchEthereumChain', [{ chainId: CHAIN_CONFIG.chainId }])
      } catch (switchError: any) {
        console.warn('Switch chain failed, attempting to add chain:', switchError)
        try {
          await p.send('wallet_addEthereumChain', [CHAIN_CONFIG])
        } catch (addError) {
          console.error('Failed to add chain:', addError)
        }
      }

      // Recreate provider after chain switch to ensure correct network state
      const updatedP = new BrowserProvider((window as any).ethereum)
      const s = await updatedP.getSigner()
      const addr = await s.getAddress()
      const bal = await updatedP.getBalance(addr)

      setProvider(updatedP)
      setSigner(s)
      setAddress(addr)
      setBalance(ethers.formatEther(bal))
    } catch (e) {
      console.error('Wallet connect failed:', e)
    }
    setIsConnecting(false)
  }, [])

  return { address, signer, provider, balance, isConnecting, connect }
}
