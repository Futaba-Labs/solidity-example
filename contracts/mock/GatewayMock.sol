// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../interfaces/IGateway.sol";
import "../interfaces/IReceiver.sol";
import "../QueryType.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";

/**
 * @title Gateway Mock contract
 * @notice Contracts used when testing Gateway contracts (skipping Gelato and light client processing)
 * @notice NOT AUDITED
 */
contract GatewayMock is IGateway, Ownable, ReentrancyGuard {
    using Address for address payable;

    // nonce for query id
    uint64 public nonce;

    // Amount of native tokens in this contract
    uint256 public nativeTokenAmount;

    enum QueryStatus {
        Pending,
        Success,
        Failed
    }
    struct Query {
        bytes data;
        QueryStatus status;
    }

    struct QueryData {
        uint256 height;
        bytes result;
    }

    // store key(not query id) => QueryData
    mapping(bytes32 => QueryData[]) public resultStore;

    // query id => Query
    mapping(bytes32 => Query) public queryStore;

    event Packet(
        address indexed sender,
        bytes32 indexed queryId,
        bytes packet,
        bytes message,
        address lightClient,
        address callBack
    );

    event SaveQueryData(
        bytes32 indexed key,
        uint256 indexed height,
        bytes result
    );
    event ReceiveQuery(
        bytes32 indexed queryId,
        bytes message,
        address lightClient,
        address callBack,
        bytes[] results
    );
    event ReceiverError(bytes32 indexed queryId, bytes reason);

    event Withdraw(address indexed to, uint256 indexed amount);

    error ZeroAddress();
    error InvalidQueryId(bytes32 queryId);
    error InvalidStatus(QueryStatus status);
    error InvalidProof(bytes32 queryId);
    error InvalidFee();

    constructor() {
        nonce = 1;
    }

    /**
     * @notice This contract is an endpoint for executing query
     * @param queries query data
     * @param lightClient The light client contract address
     * @param callBack The callback contract address
     * @param message Data used when executing callback
     */
    function query(
        QueryType.QueryRequest[] memory queries,
        address lightClient,
        address callBack,
        bytes calldata message
    ) external payable nonReentrant {
        if (callBack == address(0) || lightClient == address(0)) {
            revert ZeroAddress();
        }
        for (uint i = 0; i < queries.length; i++) {
            QueryType.QueryRequest memory q = queries[i];
            if (q.to == address(0)) {
                revert ZeroAddress();
            }
        }

        require(callBack != address(0), "Futaba: Invalid callback contract");

        if (msg.value < estimateFee(lightClient, queries)) {
            revert InvalidFee();
        }

        bytes memory encodedPayload = abi.encode(
            callBack,
            queries,
            message,
            lightClient
        );
        bytes32 queryId = keccak256(abi.encodePacked(encodedPayload, nonce));
        emit Packet(
            tx.origin,
            queryId,
            encodedPayload,
            message,
            lightClient,
            callBack
        );
        queryStore[queryId] = Query(encodedPayload, QueryStatus.Pending);
        nonce++;

        nativeTokenAmount = nativeTokenAmount + msg.value;
    }

    /**
     * @notice This function is an endpoint for receiving query
     * @param response query response data
     */
    function receiveQuery(
        QueryType.QueryResponse memory response
    ) external payable {
        bytes32 queryId = response.queryId;
        Query memory storedQuery = queryStore[queryId];

        if (keccak256(storedQuery.data) == keccak256(bytes(""))) {
            revert InvalidQueryId(queryId);
        }

        if (storedQuery.status != QueryStatus.Pending) {
            revert InvalidStatus(storedQuery.status);
        }

        (
            address callBack,
            QueryType.QueryRequest[] memory queries,
            bytes memory message,
            address lc
        ) = abi.decode(
                storedQuery.data,
                (address, QueryType.QueryRequest[], bytes, address)
            );

        bytes[] memory results = abi.decode(response.proof, (bytes[]));

        // save results
        for (uint i = 0; i < results.length; i++) {
            QueryType.QueryRequest memory q = queries[i];
            bytes memory result = results[i];
            bytes32 storeKey = keccak256(
                abi.encodePacked(q.dstChainId, q.to, q.slot)
            );

            resultStore[storeKey].push(QueryData(q.height, result));
            emit SaveQueryData(storeKey, q.height, result);
        }

        // call back to receiver contract
        try
            IReceiver(callBack).receiveQuery(queryId, results, queries, message)
        {
            queryStore[queryId].status = QueryStatus.Success;
            emit ReceiveQuery(queryId, message, lc, callBack, results);
        } catch Error(string memory reason) {
            emit ReceiverError(queryId, bytes(reason));
            queryStore[queryId].status = QueryStatus.Failed;
        }
    }

    /**
     * @notice This function is used to estimate the cost of gas (No transaction fees charged at this time)
     * @param lightClient The light client contract address
     * @param queries query data
     */
    function estimateFee(
        address lightClient,
        QueryType.QueryRequest[] memory queries
    ) public view returns (uint256) {
        return 10000;
    }

    /**
     * @notice Accessing past query results
     * @param queries Query request
     * @return bytes[] Query results
     */
    function getCache(
        QueryType.QueryRequest[] memory queries
    ) external view returns (bytes[] memory) {
        uint256 querySize = queries.length;
        require(querySize <= 100, "Futaba: Too many queries");
        bytes[] memory cache = new bytes[](querySize);
        for (uint i; i < querySize; i++) {
            QueryType.QueryRequest memory q = queries[i];

            // Calculate key stored
            bytes32 storeKey = keccak256(
                abi.encodePacked(q.dstChainId, q.to, q.slot)
            );

            uint256 resultStoreSize = resultStore[storeKey].length;

            // If height is 0, the latest block height data can be obtained
            if (q.height == 0) {
                uint256 highestHeight = 0;
                bytes memory result;
                for (uint j; j < resultStoreSize; j++) {
                    if (resultStore[storeKey][j].height > highestHeight) {
                        highestHeight = resultStore[storeKey][j].height;
                        result = resultStore[storeKey][j].result;
                    }
                }
                cache[i] = result;
            } else {
                for (uint j; j < resultStoreSize; j++) {
                    if (resultStore[storeKey][j].height == q.height) {
                        cache[i] = resultStore[storeKey][j].result;
                        break;
                    }
                }
            }
        }

        return cache;
    }

    function getQueryStatus(
        bytes32 queryId
    ) external view returns (QueryStatus) {
        return _getQueryStatus(queryId);
    }

    /**
     * @notice Withdraw native token from the contract
     */
    function withdraw() external onlyOwner {
        address payable to = payable(msg.sender);
        (bool sent, bytes memory data) = to.call{value: nativeTokenAmount}("");
        require(sent, "Futaba: Failed to withdraw native token");
        uint256 amount = nativeTokenAmount;
        nativeTokenAmount = 0;
        emit Withdraw(to, amount);
    }

    function _getQueryStatus(
        bytes32 queryId
    ) internal view returns (QueryStatus) {
        return queryStore[queryId].status;
    }
}
