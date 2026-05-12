require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const ENV_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY = (ENV_KEY && ENV_KEY.length === 66 && ENV_KEY.startsWith("0x")) ? ENV_KEY : "0x" + "0".repeat(64);
const BLOCKCHAIN_RPC = process.env.BLOCKCHAIN_RPC || "https://evmrpc.0g.ai";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: "cancun",
            viaIR: true,
        },
    },
    networks: {
        "0g-mainnet": {
            url: BLOCKCHAIN_RPC,
            chainId: 16661,
            accounts: [PRIVATE_KEY],
        },
        "0g-testnet": {
            url: "https://evmrpc-testnet.0g.ai",
            chainId: 16602,
            accounts: [PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: {
            "0g-mainnet": "placeholder",
            "0g-testnet": "placeholder",
        },
        customChains: [
            {
                network: "0g-mainnet",
                chainId: 16661,
                urls: {
                    apiURL: "https://chainscan.0g.ai/open/api",
                    browserURL: "https://chainscan.0g.ai",
                },
            },
            {
                network: "0g-testnet",
                chainId: 16602,
                urls: {
                    apiURL: "https://chainscan-galileo.0g.ai/open/api",
                    browserURL: "https://chainscan-galileo.0g.ai",
                },
            },
        ],
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
    },
};
