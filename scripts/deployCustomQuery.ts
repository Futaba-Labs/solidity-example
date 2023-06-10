import { ethers, network } from "hardhat";
import DEPLOYMENTS from "../constants/deployment.json";

async function main() {
  const gateway = DEPLOYMENTS[network.name as keyof typeof DEPLOYMENTS].gateway;
  const lightClient = DEPLOYMENTS[network.name as keyof typeof DEPLOYMENTS]["light_client"];

  const CustomQuery = await ethers.getContractFactory("CustomQuery");
  const customQuery = await CustomQuery.deploy(gateway, lightClient);
  await customQuery.deployed();
  console.log("CustomQuery deployed to:", customQuery.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
