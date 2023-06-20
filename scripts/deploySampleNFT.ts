import { ethers } from "hardhat";

async function main() {
  const SampleNFT = await ethers.getContractFactory("SampleNFT");
  const sampleNFT = await SampleNFT.deploy({ gasLimit: 3000000 });
  await sampleNFT.deployed();
  console.log("SampleNFT deployed to:", sampleNFT.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
