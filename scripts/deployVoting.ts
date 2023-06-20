import { ethers, network } from "hardhat";
import DEPLOYMENTS from "../constants/deployment.json";

async function main() {
  const gateway = DEPLOYMENTS[network.name as keyof typeof DEPLOYMENTS].gateway;
  const lightClient = DEPLOYMENTS[network.name as keyof typeof DEPLOYMENTS]["light_client"];

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(gateway, lightClient);
  await voting.deployed();
  console.log("Voting deployed to:", voting.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
