import { task, types } from "hardhat/config";
import { deploy, getDeployments, setDeployments } from "../utils/deploy";
import { ChainStage } from "@futaba-lab/sdk";

task("TASK_DEPLOY_VOTING", "Deploy Voting contract")
  .addParam<boolean>("mainnet", "mainnet", false, types.boolean)
  .addParam<boolean>("verify", "Verify Voting contract", false, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network)
      const gateway = deployment.gateway
      const lightClient = deployment.light_client

      const deployedAddress = await deploy(hre, "Voting", [gateway, lightClient], taskArgs.verify)
      deployment.voting = deployedAddress

      await setDeployments(hre.network, deployment)

      console.log("Voting address saved to deployment.json");
      console.log("Voting depolyment is Done!");

      return null;
    }
  );
