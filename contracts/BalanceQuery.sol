// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./QueryType.sol";
import "./IReceiver.sol";
import "./IGateway.sol";

/**
 * @title BalanceQuery
 * @notice Example contract to execute and receive queries
 */
contract BalanceQuery is Ownable, ERC20, IReceiver {
    // Gateway Contract endpoint
    address public gateway;

    // Address of contract to verify storage proof
    address public ligthClient;

    constructor(
        address _gateway,
        address _lightClient
    ) ERC20("Futaba Test Token", "FTB") {
        gateway = _gateway;
        ligthClient = _lightClient;
    }

    /** @notice Query execution via gateway contract
     * @param queries Information for doing a query, see QueryType.sol
     * @param decimals Decimals of tokens
     */
    function sendQuery(
        QueryType.QueryRequest[] memory queries,
        uint256[] calldata decimals
    ) public payable {
        // Encode the decimal number of the token and the address to mint the token
        bytes memory message = abi.encode(decimals, msg.sender);

        // Check to see if fee has been sent
        require(msg.value > 0, "Insufficient fee");

        // Execute query from gateway contract
        IGateway(gateway).query{value: msg.value}(
            queries,
            ligthClient,
            address(this), // callback address
            message
        );
    }

    /** @notice Receive query results
     * @param queryId Unique id that can refer to query results, etc.
     * @param results Results of query in byte format
     * @param queries Information for doing a query, see QueryType.sol
     * @param message Encoded data for non-query use
     */

    function receiveQuery(
        bytes32 queryId,
        bytes[] memory results,
        QueryType.QueryRequest[] memory queries,
        bytes memory message
    ) public onlyGateway {
        /* 
        Decode the data stored when requesting the query
        (in this case the decimal number of the token and the address to mint)
        */
        (uint256[] memory decimals, address sender) = abi.decode(
            message,
            (uint256[], address)
        );

        // Mint the total token balance received
        uint256 amount;
        for (uint i = 0; i < results.length; i++) {
            uint256 balance = uint256(bytes32(results[i]));
            uint256 decimal = decimals[i];
            amount += balance * (10 ** (18 - decimal));
        }
        _mint(sender, amount);
    }

    /** @notice Allow data to be received only from gateway contract
     */
    modifier onlyGateway() {
        require(msg.sender == gateway, "Only gateway can call this function");
        _;
    }
}
