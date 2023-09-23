import { task, types } from "hardhat/config";
import { getDeployments, getQueryId } from "./utils";
import { FutabaQueryAPI, ChainStage, ChainId, FutabaGateway, QueryRequest, RPCS, getChainKey } from "@futaba-lab/sdk";
import { QueryType } from "../typechain-types/contracts/BalanceQuery";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ERC20ABI from "./utils/erc20.abi.json";
import { concat, hexZeroPad, keccak256 } from "ethers/lib/utils";
import { BigNumber } from "ethers";

interface Param {
  dstChainId: number,
  to: string
}

task("TASK_SEND_BALANCE_QUERY", "send balance query")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<string>("params",
    'Parameters for requesting query\nExample: [{dstChainId: 5, to: "0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43"}]',
    "", types.string)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network, taskArgs.mainnet ? ChainStage.MAINNET : ChainStage.TESTNET)
      const balanceQuery = await hre.ethers.getContractAt("BalanceQuery", deployment.balance);
      const params: Param[] = JSON.parse(taskArgs.params)
      const queryRequests: QueryType.QueryRequestStruct[] = []

      console.log("Formatting query requests...")
      const decimals: number[] = []
      for (const param of params) {
        const decimal = await getDecimals(param, hre)
        decimals.push(decimal)
        const latestBlockNumber = await getLatestBlockNumber(param, hre)
        const [signer] = await hre.ethers.getSigners()

        const queryRequest: QueryRequest = {
          dstChainId: param.dstChainId,
          to: param.to,
          height: latestBlockNumber,
          slot: calcBalanceSlot(signer.address)
        }

        queryRequests.push(queryRequest)
      }

      console.log(`Query requests: ${JSON.stringify(queryRequests)}`)

      const queryAPI = new FutabaQueryAPI(ChainStage.TESTNET, ChainId.MUMBAI)

      // @ts-ignore
      const fee = await queryAPI.estimateFee(queryRequests)
      console.log(`Fee: ${fee}`)

      try {
        console.log(`Sending query...`)
        const tx = await balanceQuery.sendQuery(queryRequests, decimals, { gasLimit: 3000000, value: fee })
        const resTx = await tx.wait()
        console.log("Query sent!")
        console.log(`tx: ${tx.hash}`)

        console.log(`Waiting for query result...`)
        const queryId = getQueryId(resTx)
        const [signer] = await hre.ethers.getSigners()
        const futabaGateway = new FutabaGateway(ChainStage.TESTNET, ChainId.MUMBAI, signer)
        const res: any = await futabaGateway.waitForQueryResult(queryId)
        console.log("Query result is received!")
        for (const r of res) {
          console.log(`result: ${BigNumber.from(r)}`)
        }
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

const getDecimals = async (param: Param, hre: HardhatRuntimeEnvironment): Promise<number> => {
  const chainKey = getChainKey(param.dstChainId)
  const rpc = RPCS[ChainStage.TESTNET][chainKey]
  const provider = new hre.ethers.providers.JsonRpcProvider(rpc)

  const erc20 = new hre.ethers.Contract(
    param.to,
    ERC20ABI,
    provider
  )
  let decimals = 18
  try {
    decimals = await erc20.decimals()
  } catch (error) {
    console.log(error)
  }
  return decimals
}

const getLatestBlockNumber = async (param: Param, hre: HardhatRuntimeEnvironment): Promise<number> => {
  const chainKey = getChainKey(param.dstChainId)
  const rpc = RPCS[ChainStage.TESTNET][chainKey]
  const provider = new hre.ethers.providers.JsonRpcProvider(rpc)
  return await provider.getBlockNumber()
}

const calcBalanceSlot = (sender: string) => {
  return keccak256(concat([
    hexZeroPad(sender, 32),
    hexZeroPad(BigNumber.from(0).toHexString(), 32),
  ]));
}
