import { task, types } from "hardhat/config";
import VOTING from "../constants/voting.json";
import { QueryType } from "../typechain-types/contracts/cross-chain-voting/Voting";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";

const relay = new GelatoRelay();

task("TASK_VOTE", "Create prposal for voting")
  .addParam<number>("proposalid", "Proposal title", 0, types.int)
  .addParam<string>("nftaddress", "NFT address", "", types.string)
  .addParam<boolean>("vote", "Proposal title", true, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const prposalId = taskArgs["proposalid"],
        nftAddress = taskArgs["nftaddress"],
        vote = taskArgs["vote"]

      const votingAddress = VOTING[hre.network.name as keyof typeof VOTING]
      const voting = await hre.ethers.getContractAt("Voting", votingAddress);
      const [owner] = await hre.ethers.getSigners();
      const queries: QueryType.QueryRequestStruct[] = [
        {
          dstChainId: 5, to: nftAddress, height:
            0, slot: hre.ethers.utils.keccak256(hre.ethers.utils.concat([hre.ethers.utils.hexZeroPad(owner.address, 32), hre.ethers.utils.hexZeroPad(hre.ethers.BigNumber.from(3).toHexString(), 32),]))
        }
      ]
      try {
        console.log("voting...")
        const fee = await relay.getEstimatedFee(80001, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", hre.ethers.BigNumber.from("1000000"), true)
        let tx = await (await voting.queryNFT(queries, prposalId, vote, { gasLimit: 1000000, value: fee })).wait()
        console.log(`✅ [${hre.network.name}] queryNFT(${queries}, ${prposalId}, ${vote})`)
        console.log(` tx: ${tx.transactionHash} `)

      } catch (e: any) {
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
