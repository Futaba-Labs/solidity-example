// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./QueryType.sol";

/**
 * @title Gateway interface
 * @notice This interfece is an endpoint for executing query
 * @notice NOT AUDITED
 */
interface IGateway {
    event Packet(
        address indexed sender,
        bytes32 indexed queryId,
        bytes packet,
        bytes message,
        address lightClient,
        address callBack
    );

    event QueryReceived(
        address callBack,
        QueryType.QueryResponse responses,
        bytes message
    );

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
    ) external payable;

    /**
     * @notice This contract is an endpoint for receiving query
     * @param response query response data
     */
    function receiveQuery(
        QueryType.QueryResponse memory response
    ) external payable;

    function estimateFee(
        address lightClient,
        QueryType.QueryRequest[] memory queries
    ) external view returns (uint256);
}
