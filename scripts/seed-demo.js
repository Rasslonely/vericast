const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        console.error("❌ deployment.json not found. Run deploy-proxy.js first.");
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    const [deployer] = await hre.ethers.getSigners();
    const explorerBase = process.env.EXPLORER_BASE_URL || "https://chainscan.0g.ai";

    console.log("=== VERICAST OMEGA — Demo Data Seeding ===");
    console.log(`Network: ${deployment.network} (Chain ID: ${deployment.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log("");

    // Get contract instances
    const veri = await hre.ethers.getContractAt("VERI", deployment.contracts.VERI);
    const arbiter = await hre.ethers.getContractAt("VericastArbiter", deployment.contracts.VericastArbiter);
    const agentId = await hre.ethers.getContractAt("VericastAgentID", deployment.contracts.VericastAgentID);

    // ============================================================
    // PART 1: Mint 10 Agent NFTs
    // ============================================================
    console.log("--- Part 1: Minting 10 Agent NFTs ---");

    const agents = [
        { name: "Human Observer 1",    type: 0 },
        { name: "Human Observer 2",    type: 0 },
        { name: "Human Observer 3",    type: 0 },
        { name: "AI Weather Analyst",  type: 1 },
        { name: "AI Game Referee",     type: 1 },
        { name: "AI Social Auditor",   type: 1 },
        { name: "AI Feed Monitor",     type: 1 },
        { name: "IoT Sensor HK Central",     type: 2 },
        { name: "IoT Sensor Causeway Bay",   type: 2 },
        { name: "IoT Sensor Victoria Peak",  type: 2 },
    ];

    for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        // Encrypted metadata: demo placeholder (hex encoded name)
        const metadata = hre.ethers.toUtf8Bytes(agent.name);
        const memoryRoot = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(agent.name));

        const tx = await agentId.mintAgent(metadata, memoryRoot, agent.type);
        const receipt = await tx.wait();
        const tokenId = i + 1;

        console.log(`  [${i + 1}/10] Minted Agent #${tokenId}: "${agent.name}" (type ${agent.type})`);
        console.log(`         tx: ${explorerBase}/tx/${receipt.hash}`);
    }

    console.log(`  ✅ ${agents.length} agents minted. Total: ${await agentId.totalMinted()}`);
    console.log("");

    // ============================================================
    // PART 2: Submit 5 State Roots
    // ============================================================
    console.log("--- Part 2: Submitting 5 State Roots ---");

    const submissions = [
        {
            stream: "game",
            key: "match_1_tick_1",
            desc: "Game: Match 1, Tick 1",
        },
        {
            stream: "game",
            key: "match_1_tick_2",
            desc: "Game: Match 1, Tick 2",
        },
        {
            stream: "depin",
            key: "sensor_hk_central",
            desc: "DePIN: HK Central sensor (22.3193, 114.1694)",
        },
        {
            stream: "depin",
            key: "sensor_causeway_bay",
            desc: "DePIN: Causeway Bay sensor (22.2783, 114.1747)",
        },
        {
            stream: "social",
            key: "feed_main_audit",
            desc: "SocialFi: Main feed sybil audit",
        },
    ];

    for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        const streamId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(sub.stream));
        const key = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(sub.key));
        const stateRoot = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`state_${sub.key}_${Date.now()}`));
        const teeSeal = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`tee_seal_gpt_oss_120b_${i}`));
        const proofHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`risc_zero_proof_${i}`));

        const tx = await arbiter.submitStateRoot(streamId, key, stateRoot, teeSeal, proofHash);
        const receipt = await tx.wait();

        console.log(`  [${i + 1}/5] ${sub.desc}`);
        console.log(`         tx: ${explorerBase}/tx/${receipt.hash}`);
    }

    console.log(`  ✅ ${submissions.length} state roots submitted. Total commits: ${await arbiter.commitCount()}`);
    console.log("");

    // ============================================================
    // Summary
    // ============================================================
    console.log("=== Seeding Complete ===");
    console.log(`  Agents minted:       ${await agentId.totalMinted()}`);
    console.log(`  State commits:       ${await arbiter.commitCount()}`);
    console.log(`  VERI total supply:   ${hre.ethers.formatEther(await veri.totalSupply())} VERI`);
    console.log("");
    console.log("=== Explorer Links ===");
    Object.entries(deployment.explorer).forEach(([name, url]) => {
        console.log(`  ${name}: ${url}`);
    });
    console.log("");
    console.log("✅ Demo data ready. Proceed to Phase 3 (Backend) and Phase 4 (Frontend).");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    });
