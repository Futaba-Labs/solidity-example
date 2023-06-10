// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./QueryType.sol";

/**
 * @title Gateway interface
 * @notice This interfece is an endpoint for executing query
 * @notice NOT AUDITED
 */
interface IGateway {
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

    function getCache(
        QueryType.QueryRequest[] memory queries
    ) external view returns (bytes[] memory);
}
