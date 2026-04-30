const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;

    console.log("=== VERICAST OMEGA — Contract Deployment ===");
    console.log(`Network: ${network} (Chain ID: ${chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} 0G`);
    console.log("");

    // ---- Step 1: Deploy VERI Token (non-upgradeable) ----
    console.log("[1/5] Deploying VERI Token...");
    const VERI = await hre.ethers.getContractFactory("VERI");
    const veri = await VERI.deploy(deployer.address);
    await veri.waitForDeployment();
    const veriAddress = await veri.getAddress();
    console.log(`  ✅ VERI deployed: ${veriAddress}`);
    console.log(`  📊 Initial supply: ${hre.ethers.formatEther(await veri.totalSupply())} VERI`);

    // ---- Step 2: Deploy VericastArbiter (UUPS Proxy) ----
    console.log("[2/5] Deploying VericastArbiter (UUPS Proxy)...");
    const Arbiter = await hre.ethers.getContractFactory("VericastArbiter");
    const arbiter = await hre.upgrades.deployProxy(
        Arbiter,
        [
            deployer.address,   // _owner
            deployer.address,   // _zkVerifier (HACKATHON MOCK — deployer as mock ZK verifier [§9])
            veriAddress          // _veriToken
        ],
        { kind: "uups" }
    );
    await arbiter.waitForDeployment();
    const arbiterAddress = await arbiter.getAddress();
    console.log(`  ✅ VericastArbiter proxy deployed: ${arbiterAddress}`);
    console.log(`  ⚠️  zkVerifier = ${deployer.address} (HACKATHON MOCK [§9])`);

    // ---- Step 3: Deploy VericastAgentID (UUPS Proxy) ----
    console.log("[3/5] Deploying VericastAgentID (UUPS Proxy)...");
    const AgentID = await hre.ethers.getContractFactory("VericastAgentID");
    const agentId = await hre.upgrades.deployProxy(
        AgentID,
        [deployer.address],   // initialOwner
        { kind: "uups" }
    );
    await agentId.waitForDeployment();
    const agentIdAddress = await agentId.getAddress();
    console.log(`  ✅ VericastAgentID proxy deployed: ${agentIdAddress}`);

    // ---- Step 4: Write deployment.json ----
    // Schema: DEVOPS_BOM.md §7.1
    const explorerBase = process.env.EXPLORER_BASE_URL || "https://chainscan.0g.ai";
    const deployment = {
        network: network === "0g-mainnet" ? "0g-mainnet" : network,
        chainId: Number(chainId),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            VERI: veriAddress,
            VericastArbiter: arbiterAddress,
            VericastAgentID: agentIdAddress,
        },
        explorer: {
            VERI: `${explorerBase}/address/${veriAddress}`,
            VericastArbiter: `${explorerBase}/address/${arbiterAddress}`,
            VericastAgentID: `${explorerBase}/address/${agentIdAddress}`,
        },
    };

    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 4));
    console.log("");
    console.log("[4/5] deployment.json written to:", deploymentPath);

    // ---- Step 5: Summary ----
    console.log("");
    console.log("=== Deployment Summary ===");
    console.log(`  VERI:              ${veriAddress}`);
    console.log(`  VericastArbiter:   ${arbiterAddress}`);
    console.log(`  VericastAgentID:   ${agentIdAddress}`);
    console.log("");
    console.log("=== Explorer Links ===");
    console.log(`  VERI:              ${deployment.explorer.VERI}`);
    console.log(`  VericastArbiter:   ${deployment.explorer.VericastArbiter}`);
    console.log(`  VericastAgentID:   ${deployment.explorer.VericastAgentID}`);
    console.log("");
    console.log("[5/5] ✅ Deployment complete. Proceed to verify.js and seed-demo.js");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
