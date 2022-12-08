import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';
import "./tasks/index";

dotenv.config();
const accounts =
  process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
    },
    mumbai: {
      chainId: 80001,
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.POLYGON_TESTNET_API_KEY}`,
      accounts
    },
    goerli: {
      chainId: 5,
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ETHEREUM_GOERLI_API_KEY}`,
      accounts
    },
    moonbase: {
      chainId: 1287,
      url: `https://moonbase-alpha.blastapi.io/${process.env.MOONBASE_API_KEY}`,
      accounts
    },
    "optimism-goerli": {
      chainId: 420,
      url: `https://opt-goerli.g.alchemy.com/v2/${process.env.OPTIMISM_GOERLI_API_KEY}`,
      accounts
    },
    "arbitrum-goerli": {
      chainId: 421613,
      url: `https://arb-goerli.g.alchemy.com/v2/${process.env.ARBITRUM_GOERLI_API_KEY}`,
      accounts
    }
  },
};

export default config;
