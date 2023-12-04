// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {QueryType} from "../QueryType.sol";
import {ILightClient} from "../interfaces/ILightClient.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Light client mock
 * @dev This interface is for verification of proof
 */

contract LightClientMock is ILightClient {
    function requestQuery(
        QueryType.QueryRequest[] memory queries
    ) external override {
        return;
    }

    function estimateFee(
        QueryType.QueryRequest[] memory queries
    ) external view override returns (uint256) {
        return 0;
    }

    function verify(
        bytes memory message
    ) external returns (bool, bytes[] memory) {
        return (true, new bytes[](0));
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external pure returns (bool) {
        return interfaceId == type(ILightClient).interfaceId;
    }

    function getInterfaceId() external pure returns (bytes4) {
        return type(ILightClient).interfaceId;
    }
}
