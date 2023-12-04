import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BalanceQuery, GatewayMock, LightClientMock } from "../typechain-types"
import { defaultAbiCoder, formatEther, formatUnits, hexZeroPad, keccak256, parseEther, parseUnits, solidityPack } from "ethers/lib/utils"
import { expect } from "chai"
import { ethers, upgrades } from "hardhat";
import { QueryType } from "../typechain-types/contracts/mock/GatewayMock"


describe("BalanceQuery", () => {

  const queries: QueryType.QueryRequestStruct[] = [
    {
      dstChainId: 1,
      to: "0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43",
      height: 10000,
      slot: hexZeroPad("0x1", 32),
    },
    {
      dstChainId: 2,
      to: "0x14cd1A7b8c547bD4A2f531ba1BF11B6c4f2b96db",
      height: 20000,
      slot: hexZeroPad("0x2", 32),
    }
  ]

  const decimals = [6, 18]

  let balanceQuery: BalanceQuery, gatewayMock: GatewayMock, lightClient: LightClientMock, owner: SignerWithAddress

  before(async () => {
    [owner] = await ethers.getSigners()
  })

  beforeEach(async () => {
    const Gateway = await ethers.getContractFactory("GatewayMock")
    const g = await upgrades.deployProxy(Gateway, [1], { initializer: 'initialize', kind: 'uups' });
    await g.deployed()
    gatewayMock = g as GatewayMock
    lightClient = await (await ethers.getContractFactory("LightClientMock")).deploy()
    balanceQuery = await (await ethers.getContractFactory("BalanceQuery")).deploy(gatewayMock.address, lightClient.address)
  })

  it("sendQuery() - Insufficient fee", async () => {
    await expect(balanceQuery.sendQuery(queries, decimals)).to.be.revertedWith("Insufficient fee")
  })

  it("sendQuery()", async () => {
    const callBack = balanceQuery.address
    const message = defaultAbiCoder.encode(["uint256[]", "address"], [decimals, owner.address])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint256 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient.address])

    const nonce = await gatewayMock.getNonce()
    const queryId = keccak256(solidityPack(["bytes", "uint256"], [encodedQueries, nonce]))

    await expect(balanceQuery.sendQuery(queries, decimals, { value: parseEther("0.01") })).to.emit(gatewayMock, "Packet").withArgs(owner.address, queryId, encodedQueries, message.toLowerCase(), lightClient.address, callBack);
  })

  it("receiveQuery() - onlyGateway", async () => {
    const callBack = balanceQuery.address
    const message = defaultAbiCoder.encode(["uint256[]", "address"], [decimals, owner.address])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint256 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient.address])

    const nonce = await gatewayMock.getNonce()
    const queryId = keccak256(solidityPack(["bytes", "uint256"], [encodedQueries, nonce]))

    await expect(balanceQuery.connect(owner).receiveQuery(queryId, [], queries, message)).to.be.revertedWith("Only gateway can call this function")
  })

  it("receiveQuery()", async () => {
    const callBack = balanceQuery.address
    const message = defaultAbiCoder.encode(["uint256[]", "address"], [decimals, owner.address])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint256 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient.address])

    const nonce = await gatewayMock.getNonce()
    const queryId = keccak256(solidityPack(["bytes", "uint256"], [encodedQueries, nonce]))
    await expect(balanceQuery.sendQuery(queries, decimals, { value: parseEther("0.01") })).to.emit(gatewayMock, "Packet").withArgs(owner.address, queryId, encodedQueries, message.toLowerCase(), lightClient.address, callBack);

    const balances = [hexZeroPad(parseUnits(formatUnits("100", 6), 12).toHexString(), 32), hexZeroPad(parseEther("200").toHexString(), 32)]
    const encodedBalances = defaultAbiCoder.encode(["bytes[]"], [balances])

    const queryResponse: QueryType.QueryResponseStruct = {
      queryId,
      proof: encodedBalances
    }

    const storeKey1 = keccak256(solidityPack(["uint256", "address", "bytes32"], [queries[0].dstChainId, queries[0].to, queries[0].slot]))
    const storeKey2 = keccak256(solidityPack(["uint256", "address", "bytes32"], [queries[1].dstChainId, queries[1].to, queries[1].slot]))

    await expect(gatewayMock.connect(owner).receiveQuery(queryResponse))
      .to.emit(gatewayMock, "SaveQueryData").withArgs(storeKey1, queries[0].height, balances[0])
      .to.emit(gatewayMock, "SaveQueryData").withArgs(storeKey2, queries[1].height, balances[1])
      .to.emit(gatewayMock, "ReceiveQuery").withArgs(queryId, message.toLowerCase(), lightClient.address, callBack, balances)

    const newBalance = await balanceQuery.balanceOf(owner.address)
    expect(newBalance).to.eq(parseEther("300"))
  })
})
