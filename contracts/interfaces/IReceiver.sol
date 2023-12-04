// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {QueryType} from "../QueryType.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Receiver interface
 * @dev This interface is for the user to receive the results of the query
 */
interface IReceiver is IERC165 {
    function receiveQuery(
        bytes32 queryId,
        bytes[] memory results,
        QueryType.QueryRequest[] memory queries,
        bytes memory message
    ) external;
}
