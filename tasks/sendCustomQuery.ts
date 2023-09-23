import { task, types } from "hardhat/config";
import { getDeployments } from "./utils/deploy";
import { QueryType } from "../typechain-types/contracts/CustomQuery";
import { ChainId, ChainStage, FutabaGateway, FutabaQueryAPI } from "@futaba-lab/sdk";
import { getQueryId } from "./utils";

task("TASK_SEND_CUSTOM_QUERY", "send custom query")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<string>("params",
    'Parameters for requesting query\nExample: [{dstChainId: 5, height: 8000000, to: "0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43", slot: "0x0"}]',
    "", types.string)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network, taskArgs.mainnet ? ChainStage.MAINNET : ChainStage.TESTNET)
      const customQuery = await hre.ethers.getContractAt("CustomQuery", deployment.custom);
      const queryRequests: QueryType.QueryRequestStruct[] = JSON.parse(taskArgs.params)

      const queryAPI = new FutabaQueryAPI(ChainStage.TESTNET, ChainId.MUMBAI)

      // @ts-ignore
      const fee = await queryAPI.estimateFee(queryRequests)
      console.log(`Fee: ${fee}`)

      try {
        console.log(`Sending query...`)
        const tx = await customQuery.query(queryRequests, { gasLimit: 3000000, value: fee })
        const resTx = await tx.wait()
        console.log("Query sent!")
        console.log(`tx: ${tx.hash}`)

        console.log(`Waiting for query result...`)
        const queryId = getQueryId(resTx)
        const [signer] = await hre.ethers.getSigners()
        const futabaGateway = new FutabaGateway(ChainStage.TESTNET, ChainId.MUMBAI, signer)
        const res = await futabaGateway.waitForQueryResult(queryId)
        console.log("Query result is received!")
        console.log(`result: ${res}`)
      } catch (e: any) {
        if (e.error.message.includes("The chainId + address is already trusted")) {
          console.log("*source already set*")
        } else {
          console.log(e)
          console.log(`❌ [${hre.network.name}] query(${JSON.stringify(queryRequests)})`)
        }
      }

      return null;
    }
  );
