import { task, types } from "hardhat/config";
import VOTING from "../constants/voting.json";

task("TASK_GET_PROPOSAL", "Create prposal for voting")
  .addParam<number>("proposalid", "Proposal title", 0, types.int)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const prposalId = taskArgs["proposalid"]
      const votingAddress = VOTING[hre.network.name as keyof typeof VOTING]
      const voting = await hre.ethers.getContractAt("Voting", votingAddress);
      try {
        const proposal = await voting.getProposal(prposalId)
        console.log(proposal)

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
