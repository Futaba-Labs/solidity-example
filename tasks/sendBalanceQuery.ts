import { task, types } from "hardhat/config";
import { getDeployments } from "./utils/deploy";

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

      // TODO calc decimals

      // TODO get latest block number

      // TODO format query requests

      // TODO get estimated fee
      const fee = 0
      console.log(`fee: ${fee}`)

      try {
        const tx = await balanceQuery.sendQuery(params, [], { gasLimit: 2000000, value: fee })

      } catch (e: any) {
        if (e.error.message.includes("The chainId + address is already trusted")) {
          console.log("*source already set*")
        } else {
          console.log(e)
          console.log(`❌ [${hre.network.name}] sendQuery(${gateway})`)
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