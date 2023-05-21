// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./QueryType.sol";
import "./IReceiver.sol";
import "./IGateway.sol";
import "./IFutabaTokenMock.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BalanceQuery is Ownable, IReceiver {
    address public gateway;
    address public ligthClient;
    address public token;

    constructor(address _gateway, address _lightClient, address _token) {
        gateway = _gateway;
        ligthClient = _lightClient;
        token = _token;
    }

    function sendQuery(
        QueryType.QueryRequest[] memory queries,
        uint256[] calldata decimals
    ) public payable {
        bytes memory message = abi.encode(decimals, msg.sender);
        require(msg.value > 0, "Insufficient fee");
        IGateway(gateway).query{value: msg.value}(
            queries,
            ligthClient,
            address(this),
            message
        );
    }

    function receiveQuery(
        bytes32 queryId,
        bytes[] memory results,
        QueryType.QueryRequest[] memory queries,
        bytes memory message
    ) public onlyGateway {
        (uint256[] memory decimals, address sender) = abi.decode(
            message,
            (uint256[], address)
        );

        uint256 amount;
        for (uint i = 0; i < results.length; i++) {
            uint256 balance = uint256(bytes32(results[i]));
            uint256 decimal = decimals[i];
            amount += balance * (10 ** (18 - decimal));
        }
        IFutabaTokenMock(token).mint(sender, amount);
    }

    function setGateway(address _gateway) public onlyOwner {
        gateway = _gateway;
    }

    function setLightClient(address _lightClient) public onlyOwner {
        ligthClient = _lightClient;
    }

    function setToken(address _token) public onlyOwner {
        token = _token;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway, "Only gateway can call this function");
        _;
    }
}
