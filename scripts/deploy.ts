import { ethers, network } from "hardhat";
import DEPLOYMENTS from "../constants/deployment.json";

async function main() {
  const gateway = DEPLOYMENTS[network.name as keyof typeof DEPLOYMENTS].gateway;
  const lightClient = DEPLOYMENTS[network.name as keyof typeof DEPLOYMENTS]["light_client"];

  const FutabaTokenMock = await ethers.getContractFactory("FutabaTokenMock");
  const token = await FutabaTokenMock.deploy();
  await token.deployed();
  console.log("FutabaTokenMock deployed to:", token.address);

  const BalanceQuery = await ethers.getContractFactory("BalanceQuery");
  const balanceQuery = await BalanceQuery.deploy(gateway, lightClient, token.address);
  await balanceQuery.deployed();
  console.log("BalanceQuery deployed to:", balanceQuery.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
