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
    console.log("=== VERICAST OMEGA — Contract Verification ===");
    console.log(`Network: ${deployment.network} (Chain ID: ${deployment.chainId})`);
    console.log("");

    // ---- Verify VERI (non-upgradeable) ----
    console.log("[1/3] Verifying VERI Token...");
    try {
        await hre.run("verify:verify", {
            address: deployment.contracts.VERI,
            constructorArguments: [deployment.deployer],
        });
        console.log(`  ✅ VERI verified: ${deployment.explorer.VERI}`);
    } catch (e) {
        if (e.message.includes("Already Verified") || e.message.includes("already verified")) {
            console.log(`  ℹ️  VERI already verified`);
        } else {
            console.log(`  ⚠️  VERI verification failed: ${e.message}`);
        }
    }

    // ---- Verify VericastArbiter (UUPS Proxy) ----
    console.log("[2/3] Verifying VericastArbiter...");
    try {
        // OZ hardhat-upgrades stores implementation address internally
        // Calling verify on proxy address triggers implementation verification
        await hre.run("verify:verify", {
            address: deployment.contracts.VericastArbiter,
        });
        console.log(`  ✅ VericastArbiter verified: ${deployment.explorer.VericastArbiter}`);
    } catch (e) {
        if (e.message.includes("Already Verified") || e.message.includes("already verified")) {
            console.log(`  ℹ️  VericastArbiter already verified`);
        } else {
            console.log(`  ⚠️  VericastArbiter verification failed: ${e.message}`);
            console.log(`  💡 Try manually: npx hardhat verify ${deployment.contracts.VericastArbiter} --network ${hre.network.name}`);
        }
    }

    // ---- Verify VericastAgentID (UUPS Proxy) ----
    console.log("[3/3] Verifying VericastAgentID...");
    try {
        await hre.run("verify:verify", {
            address: deployment.contracts.VericastAgentID,
        });
        console.log(`  ✅ VericastAgentID verified: ${deployment.explorer.VericastAgentID}`);
    } catch (e) {
        if (e.message.includes("Already Verified") || e.message.includes("already verified")) {
            console.log(`  ℹ️  VericastAgentID already verified`);
        } else {
            console.log(`  ⚠️  VericastAgentID verification failed: ${e.message}`);
            console.log(`  💡 Try manually: npx hardhat verify ${deployment.contracts.VericastAgentID} --network ${hre.network.name}`);
        }
    }

    console.log("");
    console.log("=== Verification Complete ===");
    console.log("Check explorer links:");
    Object.entries(deployment.explorer).forEach(([name, url]) => {
        console.log(`  ${name}: ${url}`);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });
