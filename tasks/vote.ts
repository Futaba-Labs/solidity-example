import { task, types } from "hardhat/config";
import { QueryType } from "../typechain-types/contracts/cross-chain-voting/Voting";
import { getDeployments, getQueryId } from "./utils";
import { ChainId, ChainStage, FutabaGateway } from "@futaba-lab/sdk";
import GATEWAY_ABI from "../constants/gateway.abi.json"

task("TASK_VOTE", "Create prposal for voting")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<number>("proposalid", "Proposal title", 0, types.int)
  .addParam<string>("nftaddress", "NFT address", "", types.string)
  .addParam<boolean>("vote", "Proposal title", true, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const prposalId = taskArgs["proposalid"],
        nftAddress = taskArgs["nftaddress"],
        vote = taskArgs["vote"]

      const deployment = await getDeployments(hre.network)
      const votingAddress = deployment.voting
      const voting = await hre.ethers.getContractAt("Voting", votingAddress);
      const [owner] = await hre.ethers.getSigners();
      const queries: QueryType.QueryRequestStruct[] = [
        {
          dstChainId: 5, to: nftAddress, height:
            0, slot: hre.ethers.utils.keccak256(hre.ethers.utils.concat([hre.ethers.utils.hexZeroPad(owner.address, 32), hre.ethers.utils.hexZeroPad(hre.ethers.BigNumber.from(3).toHexString(), 32),]))
        }
      ]

      console.log(`Query requests: ${JSON.stringify(queries)}`)

      const [signer] = await hre.ethers.getSigners()
      const gateway = new hre.ethers.Contract(
        deployment.gateway,
        GATEWAY_ABI,
        signer
      );
      console.log(`Estimating fee...`)
      const fee = await gateway.estimateFee(deployment.light_client, queries)
      console.log(`Fee: ${fee}`)

      try {
        console.log("Voting...")
        const tx = await (await voting.queryNFT(queries, prposalId, vote, { gasLimit: 3000000, value: fee })).wait()
        console.log(`✅ [${hre.network.name}] queryNFT(${queries}, ${prposalId}, ${vote})`)
        console.log(` tx: ${tx.transactionHash} `)

        const queryId = getQueryId(tx)
        const [signer] = await hre.ethers.getSigners()
        const futabaGateway = new FutabaGateway(ChainStage.TESTNET, ChainId.MUMBAI, signer)
        await futabaGateway.waitForQueryResult(queryId)
        console.log("Query result is received!")

      } catch (e: any) {
        console.log(e)
        if (e.error.message.includes("The chainId + address is already trusted")) {
          console.log("*source already set*")
        } else {
          console.log(e)
          console.log(`❌[${hre.network.name}] queryNFT(${queries}, ${prposalId}, ${vote})`)
        }
      }
      return null;
    }
  );
