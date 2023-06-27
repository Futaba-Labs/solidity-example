// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./QueryType.sol";
import "./interfaces/IReceiver.sol";
import "./interfaces/IGateway.sol";

/**
 * @title CustomQuery
 * @notice The contarct that can execute arbitrary queries
 */

contract CustomQuery is IReceiver, Ownable {
    IGateway public gateway;
    address public lightClient;

    event QueryExecuted(
        bytes32 indexed queryId,
        address indexed sender,
        bytes[] results,
        QueryType.QueryRequest[] queries
    );

    constructor(address _gateway, address _lightClient) {
        gateway = IGateway(_gateway);
        lightClient = _lightClient;
    }

    function query(QueryType.QueryRequest[] memory queries) public payable {
        // Encode the decimal number of the token and the address to mint the token
        bytes memory message = abi.encode(msg.sender);

        // Check to see if fee has been sent
        require(msg.value > 0, "Insufficient fee");

        // Execute query from gateway contract
        gateway.query{value: msg.value}(
            queries,
            lightClient,
            address(this),
            message
        );
    }

    function receiveQuery(
        bytes32 queryId,
        bytes[] memory results,
        QueryType.QueryRequest[] memory queries,
        bytes memory message
    ) external onlyGateway {
        address sender = abi.decode(message, (address));
        emit QueryExecuted(queryId, sender, results, queries);
    }

    function getCache(
        QueryType.QueryRequest[] memory queries
    ) public view returns (bytes[] memory) {
        return gateway.getCache(queries);
    }

    /** @notice Set gateway contract address
     * @param _gateway Gateway contract address
     */
    function setGateway(address _gateway) public onlyOwner {
        gateway = IGateway(_gateway);
    }

    /** @notice Set light client contract address
     * @param _lightClient Light client contract address
     */
    function setLightClient(address _lightClient) public onlyOwner {
        lightClient = _lightClient;
    }

    modifier onlyGateway() {
        require(
            msg.sender == address(gateway),
            "Only gateway can call this function"
        );
        _;
    }
}
