// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract QueryType {
    struct QueryRequest {
        uint32 dstChainId;
        address to;
        // block height
        uint256 height;
        // storage slot
        bytes32 slot;
    }
}
