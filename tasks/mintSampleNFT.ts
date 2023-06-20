import { task, types } from "hardhat/config";

task("TASK_MINT_SAMPLE_NFT", "Mint sample NFT")
  .addParam<string>("address", "NFT address", "", types.string)
  .addParam<string>("to", "address NFT minted to", "", types.string)
  .addParam<string>("uri", "NFT URI", "", types.string)
  .setAction(
    async (taskArgs, hre): Promise<null> => {
      const sampleNFT = await hre.ethers.getContractAt("SampleNFT", taskArgs.address);
      const to = taskArgs.to
      const uri = taskArgs.uri || "https://ipfs.io/ipfs/QmfJ6Cteio9Xe1HN6XF4s6XTquN5iUXn2sCTXyUy6TpEed?filename=futaba_512.png";
      try {
        console.log(`mint new NFT...`)
        let tx = await (await sampleNFT.safeMint(to, uri, { gasLimit: 2000000 })).wait()
        console.log(`✅ [${hre.network.name}] safeMint(${to}, ${uri})`)
        console.log(` tx: ${tx.transactionHash}`)

      } catch (e: any) {
        if (e.error.message.includes("The chainId + address is already trusted")) {
          console.log("*source already set*")
        } else {
          console.log(e)
          console.log(`❌ [${hre.network.name}] safeMint(${to}, ${uri})`)
        }
      }
      return null;
    }
  );
