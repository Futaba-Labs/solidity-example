import { task, types } from "hardhat/config";
import DEPLOYMENT from "../constants/deployment.json"
import { getDeployments } from "./utils";
import { ChainStage } from "@futaba-lab/sdk";

task("TASK_SET_GATEWAY", "Set gateway contract address")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<string>("gateway", "Gateway contract address", "", types.string)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network, taskArgs.mainnet ? ChainStage.MAINNET : ChainStage.TESTNET)
      const gateway = taskArgs.gateway

      const balanceQuery = await hre.ethers.getContractAt("BalanceQuery", deployment.balance)
      const customQuery = await hre.ethers.getContractAt("CustomQuery", deployment.custom)
      const voting = await hre.ethers.getContractAt("Voting", deployment.voting)
      try {
        console.log(`Set gateway on BalanceQuery...`)
        let tx = await (await balanceQuery.setGateway(gateway, { gasLimit: 2000000 })).wait()
        console.log(`tx: ${tx.transactionHash}`)
        console.log("Set gateway on CustomQuery...")
        tx = await (await customQuery.setGateway(gateway, { gasLimit: 2000000 })).wait()
        console.log(`tx: ${tx.transactionHash}`)
        console.log("Set gateway on Voting...")
        tx = await (await voting.setGateway(gateway, { gasLimit: 2000000 })).wait()
        console.log(`tx: ${tx.transactionHash}`)
        console.log(`✅ [${hre.network.name}] setGateway(${gateway})`)
      } catch (e: any) {
        if (e.error.message.includes("The chainId + address is already trusted")) {
          console.log("*source already set*")
        } else {
          console.log(e)
          console.log(`❌ [${hre.network.name}] setGateway(${gateway})`)
        }
      }
      return null;
    }
  );
