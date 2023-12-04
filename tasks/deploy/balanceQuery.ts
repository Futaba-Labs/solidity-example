import { task, types } from "hardhat/config";
import { deploy, getDeployments, setDeployments } from "../utils/deploy";
import { ChainStage } from "@futaba-lab/sdk";

task("TASK_DEPLOY_BALANCE_QUERY", "Deploy BalanceQuery contract")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<boolean>("verify", "Verify BalanceQuery contract", false, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network)
      const gateway = deployment.gateway
      const lightClient = deployment["light_client"]

      const deployedAddress = await deploy(hre, "BalanceQuery", [gateway, lightClient], taskArgs.verify)
      deployment.balance = deployedAddress

      await setDeployments(hre.network, deployment)

      console.log("BalanceQuery address saved to deployment.json");
      console.log("BalanceQuery depolyment is Done!");

      return null;
    }
  );
