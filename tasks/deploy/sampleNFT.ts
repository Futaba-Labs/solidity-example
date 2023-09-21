import { task, types } from "hardhat/config";
import { deploy } from "../utils/deploy";

const IMAGE_PATH = "https://ipfs.io/ipfs/QmfJ6Cteio9Xe1HN6XF4s6XTquN5iUXn2sCTXyUy6TpEed?filename=futaba_512.png"

task("TASK_DEPLOY_SAMPLE_NFT", "Deploy SampleNFT contract")
  .addParam<boolean>("verify", "Verify SampleNFT contract", false, types.boolean)
  .setAction(
    async (taskArgs, hre): Promise<null> => {

      await deploy(hre, "SampleNFT", [IMAGE_PATH], taskArgs.verify)
      console.log("SampleNFT depolyment is Done!");

      return null;
    }
  );
