import { ethers } from 'ethers'
import deployment from '../deployment.json'

// ABI fragments
const ARBITER_ABI = [
  'function submitStateRoot(bytes32,bytes32,bytes32,bytes32,bytes32) external',
  'function getCommit(bytes32) view returns (tuple(bytes32,bytes32,bytes32,uint64,uint32,bool,bool))',
  'event StateSubmitted(bytes32 indexed, bytes32, bytes32, address indexed)',
]

const AGENT_ID_ABI = [
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
  'function agents(uint256) view returns (bytes,bytes32,bytes32,uint64,uint64,uint8)',
  'event AgentMinted(uint256 indexed, address, uint8)',
]

export function useContracts(signer: ethers.Signer | null) {
  if (!signer) return { arbiter: null, agentId: null }

  const arbiter = new ethers.Contract(
    deployment.contracts.VericastArbiter, ARBITER_ABI, signer
  )
  const agentId = new ethers.Contract(
    deployment.contracts.VericastAgentID, AGENT_ID_ABI, signer
  )

  return { arbiter, agentId }
}
