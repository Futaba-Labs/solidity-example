import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployment } from "./types";
import fs from 'fs';
const FILE_PATH = "./constants/deployment.json"

export const deploy = async (hre: HardhatRuntimeEnvironment, contractName: string, constructorArgs: any[], verify: boolean): Promise<string> => {
  const TargetContract = await hre.ethers.getContractFactory(contractName);

  console.log(`Deploying ${contractName} contract...`);

  if (constructorArgs.length !== TargetContract.interface.deploy.inputs.length) {
    throw new Error(`constructorArgs length is not equal to ${TargetContract.interface.deploy.inputs.length}`)
  }

  const targetContract = await TargetContract.deploy(...constructorArgs)
  await targetContract.deployed();
  console.log(`${contractName} deployed to:`, targetContract.address);
  console.log(`Transaction hash: ${targetContract.deployTransaction.hash}`);

  if (verify) {
    await new Promise(f => setTimeout(f, 10000))

    await hre.run("TASK_VERIFY", {
      address: targetContract.address,
      constructorArguments: constructorArgs
    });
  }

  return targetContract.address
}

export const getDeployments = async (network: string): Promise<Deployment> => {
  const data = await fs.promises.readFile(FILE_PATH, 'utf8');
  const deployment = JSON.parse(data.toString());
  return deployment[network];
}

export const setDeployments = async (deployment: Deployment) => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(deployment))
}