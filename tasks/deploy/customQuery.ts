import { task, types } from "hardhat/config";
import { deploy, getDeployments, setDeployments } from "../utils/deploy";

task("TASK_DEPLOY_CUSTOM_QUERY", "Deploy CustomQuery contract")
  .addParam<boolean>("verify", "Verify CustomQuery contract", false, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const deployment = await getDeployments(hre.network.name)
      const gateway = deployment.gateway
      const lightClient = deployment.light_client

      const deployedAddress = await deploy(hre, "CustomQuery", [gateway, lightClient], taskArgs.verify)

      deployment.custom = deployedAddress
      setDeployments(deployment)

      console.log("CustomQuery address saved to deployment.json");
      console.log("CustomQuery depolyment is Done!");

      return null;
    }
  );
