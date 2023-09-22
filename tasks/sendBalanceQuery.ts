import { task, types } from "hardhat/config";
import { getDeployments, getQueryId } from "./utils";
import { FutabaQueryAPI, ChainStage, ChainId, FutabaGateway, QueryRequest } from "@futaba-lab/sdk";
import { QueryType } from "../typechain-types/contracts/BalanceQuery";

interface Param {
  dstChainId: number,
  to: string
}

task("TASK_SEND_BALANCE_QUERY", "send balance query")
  .addParam<string>("params",
    'Parameters for requesting query\nExample: [{dstChainId: 5, to: "0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43"}]',
    "", types.string)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network.name)
      const balanceQuery = await hre.ethers.getContractAt("BalanceQuery", deployment.balance);
      const params: Param[] = JSON.parse(taskArgs.params)
      const queryRequests: QueryType.QueryRequestStruct[] = []

      // TODO calc decimals

      // TODO get latest block number

      // TODO format query requests

      const queryAPI = new FutabaQueryAPI(ChainStage.TESTNET, ChainId.MUMBAI)

      // @ts-ignore
      const fee = await queryAPI.estimateFee(queryRequests)
      console.log(`fee: ${fee}`)

      try {
        console.log(`Sending query...`)
        const tx = await balanceQuery.sendQuery(queryRequests, [], { gasLimit: 3000000, value: fee })
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

const getDecimals = async (param: Param): Promise<number> => {
  return 18
}

const getLatestBlockNumber = async (param: Param): Promise<number> => {
  return 0
}