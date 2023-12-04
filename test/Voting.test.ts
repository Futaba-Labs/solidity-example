import { defaultAbiCoder } from "@ethersproject/abi"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { hexZeroPad, keccak256, solidityPack, parseEther, parseUnits, formatUnits } from "ethers/lib/utils"
import { BalanceQuery, GatewayMock, Voting } from "../typechain-types"
import { QueryType } from "../typechain-types/contracts/mock/GatewayMock"

describe("Voting", () => {
  // dummy address
  const lightClient = "0xA171Ec7644385e3dcc5A68af62E6c317f210c7b9"

  const queries: QueryType.QueryRequestStruct[] = [
    {
      dstChainId: 1,
      to: "0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43",
      height: 10000,
      slot: hexZeroPad("0x1", 32),
    }
  ]

  const title = "Proposal test"
  const description = "Proposal description"
  const voteExpirationTime = 300
  const height = 10000
  const vote = true
  const proposalId = 1

  let voting: Voting, gatewayMock: GatewayMock, owner: SignerWithAddress

  before(async () => {
    [owner] = await ethers.getSigners()
  })

  beforeEach(async () => {
    gatewayMock = await (await ethers.getContractFactory("GatewayMock")).deploy()
    voting = await (await ethers.getContractFactory("Voting")).deploy(gatewayMock.address, lightClient)
  })

  it("createProposal() - Zero expiration time", async () => {
    await expect(voting.createProposal(title, description, 0, height)).to.be.revertedWith("The voting period cannot be 0")
  })

  it("createProposal()", async () => {
    await expect(voting.createProposal(title, description, voteExpirationTime, height)).to.emit(voting, "ProposalCreated").withArgs(owner.address, proposalId, title, description, 300)

  })

  it("queryNFT() - Invalid proposal id", async () => {
    await expect(voting.createProposal(title, description, voteExpirationTime, height)).to.emit(voting, "ProposalCreated").withArgs(owner.address, proposalId, title, description, 300)

    await expect(voting.queryNFT(queries, 2, vote, { value: parseEther("0.01") })).to.be.revertedWith("Not a valid Proposal Id")
  })

  it("queryNFT()", async () => {
    await expect(voting.createProposal(title, description, voteExpirationTime, height)).to.emit(voting, "ProposalCreated").withArgs(owner.address, proposalId, title, description, 300)

    const callBack = voting.address
    const message = defaultAbiCoder.encode(["address", "uint256", "bool"], [owner.address, proposalId, vote])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint32 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient])

    const nonce = await gatewayMock.getNonce()
    const queryId = keccak256(solidityPack(["bytes", "uint64"], [encodedQueries, nonce]))

    await expect(voting.queryNFT(queries, proposalId, vote, { value: parseEther("0.01") })).to.emit(gatewayMock, "Packet").withArgs(owner.address, queryId, encodedQueries, message.toLowerCase(), lightClient, callBack);
  })

  it("receiveQuery() - onlyGateway", async () => {
    await expect(voting.createProposal(title, description, voteExpirationTime, height)).to.emit(voting, "ProposalCreated").withArgs(owner.address, proposalId, title, description, 300)

    const callBack = voting.address
    const message = defaultAbiCoder.encode(["address", "uint256", "bool"], [owner.address, proposalId, vote])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint32 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient])

    const nonce = await gatewayMock.getNonce()
    const queryId = keccak256(solidityPack(["bytes", "uint64"], [encodedQueries, nonce]))

    await expect(voting.connect(owner).receiveQuery(queryId, [], queries, message)).to.be.revertedWith("Only gateway can call this function")
  })

  it("receiveQuery()", async () => {
    await expect(voting.createProposal(title, description, voteExpirationTime, height)).to.emit(voting, "ProposalCreated").withArgs(owner.address, proposalId, title, description, 300)

    const callBack = voting.address
    const message = defaultAbiCoder.encode(["address", "uint256", "bool"], [owner.address, proposalId, vote])

    const encodedQueries = defaultAbiCoder.encode(["address", "tuple(uint32 dstChainId, address to, uint256 height, bytes32 slot)[]", "bytes", "address"], [callBack, queries, message, lightClient])

    const nonce = await gatewayMock.getNonce()
    const queryId = keccak256(solidityPack(["bytes", "uint64"], [encodedQueries, nonce]))

    await expect(voting.queryNFT(queries, proposalId, vote, { value: parseEther("0.01") })).to.emit(gatewayMock, "Packet").withArgs(owner.address, queryId, encodedQueries, message.toLowerCase(), lightClient, callBack);

    const results = [hexZeroPad("0x1", 32)]
    const encodedBalances = defaultAbiCoder.encode(["bytes[]"], [results])

    const queryResponse: QueryType.QueryResponseStruct = {
      queryId,
      proof: encodedBalances
    }

    const storeKey1 = keccak256(solidityPack(["uint32", "address", "bytes32"], [queries[0].dstChainId, queries[0].to, queries[0].slot]))

    await expect(gatewayMock.connect(owner).receiveQuery(queryResponse))
      .to.emit(gatewayMock, "SaveQueryData").withArgs(storeKey1, queries[0].height, results[0])
      .to.emit(gatewayMock, "ReceiveQuery").withArgs(queryId, message.toLowerCase(), lightClient, callBack, results)
      .to.emit(voting, "VoteCasted").withArgs(owner.address, proposalId, 1)

    const proposal = await voting.getProposal(proposalId)

    // hasVoted
    expect(proposal.voterInfo[0].hasVoted).to.equal(true)
    // vote
    expect(proposal.voterInfo[0].vote).to.equal(true)

  })
})
