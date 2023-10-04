describe("CustomQuery", () => { })
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BalanceQuery, CustomQuery, GatewayMock } from "../typechain-types"
import { ethers } from "hardhat"
import { defaultAbiCoder, formatEther, formatUnits, hexZeroPad, keccak256, parseEther, parseUnits, solidityPack } from "ethers/lib/utils"
import { expect } from "chai"
import { QueryType } from "../typechain-types/contracts/mock/GatewayMock"


describe("CustomQuery", () => {
  // dummy address
  const lightClient = "0xA171Ec7644385e3dcc5A68af62E6c317f210c7b9"

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


  let customQuery: CustomQuery, gatewayMock: GatewayMock, owner: SignerWithAddress

  before(async () => {
    [owner] = await ethers.getSigners()
  })

  beforeEach(async () => {
    gatewayMock = await (await ethers.getContractFactory("GatewayMock")).deploy()
    customQuery = await (await ethers.getContractFactory("CustomQuery")).deploy(gatewayMock.address, lightClient)
  })

  it("query() - Insufficient fee", async () => {
    await expect(customQuery.query(queries)).to.be.revertedWith("Insufficient fee")
  })

  it("query()", async () => {
    const callBack = customQuery.address
    const message = defaultAbiCoder.encode(["address"], [owner.address])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint32 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient])

    const nonce = await gatewayMock.nonce()
    const queryId = keccak256(solidityPack(["bytes", "uint64"], [encodedQueries, nonce]))

    await expect(customQuery.query(queries, { value: parseEther("0.01") })).to.emit(gatewayMock, "Packet").withArgs(owner.address, queryId, encodedQueries, message.toLowerCase(), lightClient, callBack);
  })

  it("receiveQuery() - onlyGateway", async () => {
    const callBack = customQuery.address
    const message = defaultAbiCoder.encode(["address"], [owner.address])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint32 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient])

    const nonce = await gatewayMock.nonce()
    const queryId = keccak256(solidityPack(["bytes", "uint64"], [encodedQueries, nonce]))

    await expect(customQuery.connect(owner).receiveQuery(queryId, [], queries, message)).to.be.revertedWith("Only gateway can call this function")
  })

  it("receiveQuery()", async () => {
    const callBack = customQuery.address
    const message = defaultAbiCoder.encode(["address"], [owner.address])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint32 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient])

    const nonce = await gatewayMock.nonce()
    const queryId = keccak256(solidityPack(["bytes", "uint64"], [encodedQueries, nonce]))
    await expect(customQuery.query(queries, { value: parseEther("0.01") })).to.emit(gatewayMock, "Packet").withArgs(owner.address, queryId, encodedQueries, message.toLowerCase(), lightClient, callBack);

    const balances = [hexZeroPad(parseUnits(formatUnits("100", 6), 12).toHexString(), 32), hexZeroPad(parseEther("200").toHexString(), 32)]
    const encodedBalances = defaultAbiCoder.encode(["bytes[]"], [balances])

    const queryResponse: QueryType.QueryResponseStruct = {
      queryId,
      proof: encodedBalances
    }

    const storeKey1 = keccak256(solidityPack(["uint32", "address", "bytes32"], [queries[0].dstChainId, queries[0].to, queries[0].slot]))
    const storeKey2 = keccak256(solidityPack(["uint32", "address", "bytes32"], [queries[1].dstChainId, queries[1].to, queries[1].slot]))

    await expect(gatewayMock.connect(owner).receiveQuery(queryResponse))
      .to.emit(gatewayMock, "SaveQueryData").withArgs(storeKey1, queries[0].height, balances[0])
      .to.emit(gatewayMock, "SaveQueryData").withArgs(storeKey2, queries[1].height, balances[1])
      .to.emit(gatewayMock, "ReceiveQuery").withArgs(queryId, message.toLowerCase(), lightClient, callBack, balances)

    expect(await gatewayMock.getQueryStatus(queryId)).to.be.equal(1)

    expect(await customQuery.getCache(queries)).deep.equal(balances)
  })
})
