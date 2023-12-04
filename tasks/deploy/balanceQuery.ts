import { task, types } from "hardhat/config";
import { deploy, getDeployments, setDeployments } from "../utils/deploy";
import { ChainStage } from "@futaba-lab/sdk";

task("TASK_DEPLOY_BALANCE_QUERY", "Deploy BalanceQuery contract")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<boolean>("verify", "Verify BalanceQuery contract", false, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network, taskArgs.mainnet ? ChainStage.MAINNET : ChainStage.TESTNET)
      const gateway = "0x098A0579Ff42523FFB3B4FBd3582A769eE5556Df"
      const lightClient = "0x53957A049DE3c5FAFa9DD2EaF63961A0bBdCA352"

      const deployedAddress = await deploy(hre, "BalanceQuery", [gateway, lightClient], taskArgs.verify)
      deployment.balance = deployedAddress

      await setDeployments(hre.network, deployment)

      console.log("BalanceQuery address saved to deployment.json");
      console.log("BalanceQuery depolyment is Done!");

      return null;
    }
  );
