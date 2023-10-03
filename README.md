# Futaba Contract Examples

![futaba_banner](/docs/futaba_banner.png)
[Futaba](https://futaba.gitbook.io/docs/introduction/futaba-introduction) is a protocol for cross-chain queries to retrieve data from other chains. In this repository, you can try out samples of contracts that utilize Futaba.

In the [demo](https://demo.futaba.dev/), you can experience an application that utilizes these sample contracts.

> WARNING: Futaba's contract has not undergone an audit. It is not recommended for use in a production environment.

### Install and test

```bash
yarn install
yarn test
```

### Deploy setup

Please create a `.env` file and enter your Infura API key and private key.

## Balance query

Balance query involves retrieving the balances of tokens from other chains and minting a new token equivalent to their total.

### How to deploy

Run the following command;

```bash
yarn deploy:balance --network mumbai
```

If you want to verify the contract, add `--verify true` and add scan's API key in the `.env` file.

### How to use

Run the following command;

```bash
yarn query:balance --network mumbai --params '[{"dstChainId":5,"to":"0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43", "slot": 0}]'
```

`--params` should include the destination chain id, token address, and slot.

The slot must be an ERC20 `mapping (address => uint256) _balances` slot.
You can see how to find a slot [here](https://docs.axiom.xyz/developers/sending-a-query/finding-storage-slots).

When the response transaction is returned, the mint of the token can be checked.

## Custom query

Custom query is a feature that allows you to retrieve arbitrary data and emit it as an event. Essentially, you can send a query in a similar manner to a balance query, but the input fields are different.

### How to deploy

Run the following command;

```bash
yarn deploy:custom --network mumbai
```

### How to use

Run the following command;

```bash
yarn query:custom --network mumbai --params '[{"dstChainId":5,"to":"0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43","height":8947410,"slot":"0x2cc437d98674a0b2b3c157dd747ad36fd3a3d188fad2a434e1300ef7ebabd265"}]'
```

`--params` should include the destination chain id, contract address, block height and slot.
The state at any point in time can be obtained by specifying a block height.

You can see how to find a slot [here](https://docs.axiom.xyz/developers/sending-a-query/finding-storage-slots).

You can receive the result of a response transaction returned as an event.

## Cross-chain voting

Futaba's cross-chain voting allows Ethereum goerli NFTs to run voting in Mumbai.

### How to deploy

Run the following command;

```bash
yarn deploy:nft --network goerli
yarn deploy:voting --network mumbai
```

Deploy a sample NFT and voting contract.
When deploying the sample NFT, you can add `--image <IMAGE_PATH>` to make it an arbitrary image.

### How to use

1. Mint NFT
   Mint the NFT, which is a voting right. Run the following command;

```bash
yarn mint --network goerli
```

Please check the block number of the minted transaction at this time.

2. Create proposal
   Prepare proposals for voting. Run the following command;

```bash
yarn proposal --network mumbai --title "Test proposal" --description "This is a test proposal" --expire 60 --height 8947410
```

To create a Proposal, enter the title, description, expire time, and block height.
`--expire` can be entered in minutes (60 minutes in the above example).

Also, the block height can be set to a value greater than the NFT minted to detect the NFT.

3. Voting
   Run a poll. Run the following command;

```bash
yarn vote --network mumbai --proposalid <PROPOSAL_ID> --nftaddress <NFT_ADDRESS> --vote true
```

Enter the Proposal id that is output when the proposal is created, the NFT address that you minted earlier, and whether the vote is Yes or No.

If you are entitled to vote, the response transaction completes the voting.

## Materials

- [Docs](https://futaba.gitbook.io/docs/introduction/futaba-introduction)
- [Demo](https://demo.futaba.dev/)
