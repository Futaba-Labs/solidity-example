import { task, types } from "hardhat/config";
import { deploy, getDeployments, setDeployments } from "../utils/deploy";
import { ChainStage } from "@futaba-lab/sdk";

task("TASK_DEPLOY_CUSTOM_QUERY", "Deploy CustomQuery contract")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<boolean>("verify", "Verify CustomQuery contract", false, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network, taskArgs.mainnet ? ChainStage.MAINNET : ChainStage.TESTNET)
      const gateway = deployment.gateway
      const lightClient = deployment.light_client

      const deployedAddress = await deploy(hre, "CustomQuery", [gateway, lightClient], taskArgs.verify)

      deployment.custom = deployedAddress
      await setDeployments(hre.network, deployment)

      console.log("CustomQuery address saved to deployment.json");
      console.log("CustomQuery depolyment is Done!");

      return null;
    }
  );
