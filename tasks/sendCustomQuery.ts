import { task, types } from "hardhat/config";
import { getDeployments } from "./utils/deploy";
import { QueryType } from "../typechain-types/contracts/CustomQuery";

task("TASK_SEND_CUSTOM_QUERY", "send custom query")
  .addParam<string>("params",
    'Parameters for requesting query\nExample: [{dstChainId: 5, height: 8000000, to: "0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43", slot: "0x0"}]',
    "", types.string)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network.name)
      const customQuery = await hre.ethers.getContractAt("CustomQuery", deployment.balance);
      const queryRequests: QueryType.QueryRequestStruct[] = JSON.parse(taskArgs.params)

      // TODO get estimated fee from SDK
      const fee = 0
      console.log(`fee: ${fee}`)

      try {
        console.log(`Sending query...`)
        const tx = await customQuery.query(queryRequests, { gasLimit: 3000000, value: fee })
        await tx.wait()
        console.log("Query sent!")
        console.log(`tx: ${tx.hash}`)
      } catch (e: any) {
        if (e.error.message.includes("The chainId + address is already trusted")) {
          console.log("*source already set*")
        } else {
          console.log(e)
          console.log(`❌ [${hre.network.name}] query(${JSON.stringify(queryRequests)})`)
        }
      }

      // TODO wait for response
      return null;
    }
  );
