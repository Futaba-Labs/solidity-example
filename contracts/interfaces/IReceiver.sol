// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../QueryType.sol";

/**
 * @title Receiver interface
 * @notice This interface is for the user to receive the results of the query
 * @notice NOT AUDITED
 */
interface IReceiver {
    /**
     * @notice This function is used to receive the results of the query
     * @param results The results of the query
     * @param queries The query data
     * @param message Data to be used in the callback sent at the time of the request
     */
    function receiveQuery(
        bytes32 queryId,
        bytes[] memory results,
        QueryType.QueryRequest[] memory queries,
        bytes memory message
    ) external;
}
