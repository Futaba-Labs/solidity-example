import { task, types } from "hardhat/config";
import { getDeployments } from "./utils/deploy";
import { QueryType } from "../typechain-types/contracts/CustomQuery";
import { ChainId, ChainStage, FutabaGateway } from "@futaba-lab/sdk";
import { getQueryId } from "./utils";
import GATEWAY_ABI from "../constants/gateway.abi.json"

task("TASK_SEND_CUSTOM_QUERY", "send custom query")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<string>("params",
    'Parameters for requesting query\nExample: [{dstChainId: 5, height: 8000000, to: "0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43", slot: "0x0"}]',
    "", types.string)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network)
      const customQuery = await hre.ethers.getContractAt("CustomQuery", deployment.custom);
      const queryRequests: QueryType.QueryRequestStruct[] = JSON.parse(taskArgs.params)

      console.log(`Query requests: ${JSON.stringify(queryRequests)}`)

      const [signer] = await hre.ethers.getSigners()
      const gateway = new hre.ethers.Contract(
        deployment.gateway,
        GATEWAY_ABI,
        signer
      );

      console.log(`Estimating fee...`)
      const fee = await gateway.estimateFee(deployment.light_client, queryRequests)
      console.log(`Fee: ${fee}`)

      try {
        console.log(`Sending query...`)
        const tx = await customQuery.query(queryRequests, { gasLimit: 3000000, value: fee })
        const resTx = await tx.wait()
        console.log("Query sent!")
        console.log(`tx: ${tx.hash}`)

        console.log(`Waiting for query result...`)
        const queryId = getQueryId(resTx)
        const futabaGateway = new FutabaGateway(ChainStage.TESTNET, ChainId.MUMBAI, signer)
        const { results, response } = await futabaGateway.waitForQueryResult(queryId)
        console.log("Query result is received!")
        console.log(`response: ${response.hash}`)
        console.log(`result: ${JSON.stringify(results)}`)
      } catch (e: any) {
        console.log(e)
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
