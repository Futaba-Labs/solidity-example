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
    bytes[] public results;

    constructor() {
        results = new bytes[](2);
        results[0] = results[0] = abi.encodePacked(
            uint256(
                0x0000000000000000000000000000000000000000000000000000000005f5e100
            )
        );

        results[1] = abi.encodePacked(
            uint256(
                0x00000000000000000000000000000000000000000000000ad78ebc5ac6200000
            )
        );
    }

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
        return (true, results);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external pure returns (bool) {
        return interfaceId == type(ILightClient).interfaceId;
    }

    function getInterfaceId() external pure returns (bytes4) {
        return type(ILightClient).interfaceId;
    }

    function setBool() external {
        results = [
            abi.encodePacked(
                uint256(
                    0x0000000000000000000000000000000000000000000000000000000000000001
                )
            )
        ];
    }
}
