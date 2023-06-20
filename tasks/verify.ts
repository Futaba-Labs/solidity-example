import { task, types } from "hardhat/config";

task(
  "TASK_VERIFY",
  "verify",
).addParam<string>("address", "the target contract address", "", types.string)
  .addVariadicPositionalParam("arguments", "constructor arguments", [])
  .setAction(async (taskArgs, hre): Promise<null> => {
    const address = taskArgs.address

    await hre.run("verify:verify", {
      address,
      constructorArguments: taskArgs.arguments,
    })
    return null;
  });
