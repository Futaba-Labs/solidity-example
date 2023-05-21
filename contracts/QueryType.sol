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

    struct OracleQuery {
        uint32 dstChainId;
        uint256 height;
    }

    struct OracleResponse {
        uint32 dstChainId;
        uint256 height;
        // state root
        bytes32 root;
    }

    struct QueryResponse {
        bytes32 queryId;
        bytes proof;
    }
}
