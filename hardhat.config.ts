import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from 'dotenv';
import "./tasks/index";

dotenv.config();
const accounts =
  process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];

const apiKey = process.env.INFURA_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  etherscan: {
    apiKey: {
      goerli: process.env.ETHEREUM_SCAN_KEY || "",
      polygonMumbai: process.env.POLYGON_SCAN_KEY || "",
      moonbaseAlpha: process.env.MOONBEAM_SCAN_KEY || "",
      optimisticGoerli: process.env.OPTIMISM_SCAN_KEY || "",
      arbitrumGoerli: process.env.ARBITRUM_SCAN_KEY || ""
    }
  },
  networks: {
    hardhat: {
    },
    mumbai: {
      chainId: 80001,
      url: `https://polygon-mumbai.infura.io/v3/${apiKey}`,
      accounts
    },
    goerli: {
      chainId: 5,
      url: `https://goerli.infura.io/v3/${apiKey}`,
      accounts
    },
    "optimism-goerli": {
      chainId: 420,
      url: `https://optimism-goerli.infura.io/v3/${apiKey}`,
      accounts
    },
    "arbitrum-goerli": {
      chainId: 421613,
      url: `https://arbitrum-goerli.infura.io/v3/${apiKey}`,
      accounts
    }
  },
};

export default config;
