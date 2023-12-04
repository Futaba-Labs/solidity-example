import { task, types } from "hardhat/config";
import { getDeployments } from "./utils";
import { ChainStage } from "@futaba-lab/sdk";

task("TASK_CREATE_PROPOSAL", "Create prposal for voting")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<string>("title", "Proposal title", "", types.string)
  .addParam<string>("description", "Proposal description", "", types.string)
  .addParam<number>("expire", "Proposal expire time", 0, types.int)
  .addParam<number>("height", "Block height in proposal", 0, types.int)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      let { title, description, expire, height } = taskArgs;
      const deployment = await getDeployments(hre.network)
      const votingAddress = deployment.voting
      const voting = await hre.ethers.getContractAt("Voting", votingAddress);
      try {
        console.log(`create voting proposal...`)
        let tx = await (await voting.createProposal(title, description, expire, height, { gasLimit: 2000000 })).wait()
        console.log(`✅ [${hre.network.name}] createProposal(${JSON.stringify(taskArgs)})`)
        console.log(` tx: ${tx.transactionHash}`)

      } catch (e: any) {
        if (e.error.message.includes("The chainId + address is already trusted")) {
          console.log("*source already set*")
        } else {
          console.log(e)
          console.log(`❌ [${hre.network.name}] createProposal(${JSON.stringify(taskArgs)})`)
        }
      }
      return null;
    }
  );
