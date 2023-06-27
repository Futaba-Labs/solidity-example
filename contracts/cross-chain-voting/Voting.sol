// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/IReceiver.sol";
import "../interfaces/IGateway.sol";
import "../QueryType.sol";

/**
 * @title QVVoting
 * @dev the manager for proposals / votes
 */
contract Voting is Ownable, IReceiver {
    using SafeMath for uint256;

    // Gateway Contract endpoint
    address public gateway;

    // Address of contract to verify storage proof
    address public lightClient;

    event VoteCasted(address voter, uint256 ProposalID, uint256 weight);

    event ProposalCreated(
        address creator,
        uint256 ProposalID,
        string title,
        string description,
        uint256 votingTimeInHours
    );

    enum ProposalStatus {
        IN_PROGRESS,
        TALLY,
        ENDED
    }

    struct Proposal {
        address creator;
        ProposalStatus status;
        uint256 yesVotes;
        uint256 noVotes;
        string title;
        string description;
        address[] voters;
        uint256 expirationTime;
        uint256 height;
        mapping(address => Voter) voterInfo;
    }

    struct ProposalData {
        uint256 id;
        address creator;
        ProposalStatus status;
        uint256 yesVotes;
        uint256 noVotes;
        string title;
        string description;
        address[] voters;
        uint256 expirationTime;
        uint256 height;
        Voter[] voterInfo;
    }

    struct Voter {
        bool hasVoted;
        bool vote;
        uint256 weight;
    }

    mapping(uint256 => Proposal) public Proposals;
    uint256 public ProposalCount;

    constructor(address _gateway, address _lightClient) {
        gateway = _gateway;
        lightClient = _lightClient;
    }

    /**
     * @dev Creates a new proposal.
     * @param _description the text of the proposal
     * @param _voteExpirationTime expiration time in minutes
     */
    function createProposal(
        string calldata _title,
        string calldata _description,
        uint256 _voteExpirationTime,
        uint256 _height
    ) external returns (uint256) {
        require(_voteExpirationTime > 0, "The voting period cannot be 0");
        ProposalCount++;

        Proposal storage curProposal = Proposals[ProposalCount];
        curProposal.creator = msg.sender;
        curProposal.status = ProposalStatus.IN_PROGRESS;
        curProposal.expirationTime =
            block.timestamp +
            60 *
            _voteExpirationTime *
            1 seconds;
        curProposal.description = _description;
        curProposal.title = _title;
        curProposal.height = _height;

        emit ProposalCreated(
            msg.sender,
            ProposalCount,
            _title,
            _description,
            _voteExpirationTime
        );
        return ProposalCount;
    }

    /**
     * @dev sets a proposal to TALLY.
     * @param _ProposalID the proposal id
     */
    function setProposalToTally(
        uint256 _ProposalID
    ) external validProposal(_ProposalID) onlyOwner {
        require(
            Proposals[_ProposalID].status == ProposalStatus.IN_PROGRESS,
            "Vote is not in progress"
        );
        require(
            block.timestamp >= getProposalExpirationTime(_ProposalID),
            "voting period has not expired"
        );
        Proposals[_ProposalID].status = ProposalStatus.TALLY;
    }

    /**
     * @dev sets a proposal to ENDED.
     * @param _ProposalID the proposal id
     */
    function setProposalToEnded(
        uint256 _ProposalID
    ) external validProposal(_ProposalID) onlyOwner {
        require(
            Proposals[_ProposalID].status == ProposalStatus.TALLY,
            "Proposal should be in tally"
        );
        require(
            block.timestamp >= getProposalExpirationTime(_ProposalID),
            "voting period has not expired"
        );
        Proposals[_ProposalID].status = ProposalStatus.ENDED;
    }

    /**
     * @dev returns the status of a proposal
     * @param _ProposalID the proposal id
     */
    function getProposalStatus(
        uint256 _ProposalID
    ) public view validProposal(_ProposalID) returns (ProposalStatus) {
        return Proposals[_ProposalID].status;
    }

    /**
     * @dev returns a proposal expiration time
     * @param _ProposalID the proposal id
     */
    function getProposalExpirationTime(
        uint256 _ProposalID
    ) public view validProposal(_ProposalID) returns (uint256) {
        return Proposals[_ProposalID].expirationTime;
    }

    /**
     * @dev counts the votes for a proposal. Returns (yeays, nays)
     * @param _ProposalID the proposal id
     */
    function countVotes(
        uint256 _ProposalID
    ) public view returns (uint256, uint256) {
        uint256 yesVotes = 0;
        uint256 noVotes = 0;

        address[] memory voters = Proposals[_ProposalID].voters;
        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            bool vote = Proposals[_ProposalID].voterInfo[voter].vote;
            uint256 weight = Proposals[_ProposalID].voterInfo[voter].weight;
            if (vote == true) {
                yesVotes += weight;
            } else {
                noVotes += weight;
            }
        }

        return (yesVotes, noVotes);
    }

    function queryNFT(
        QueryType.QueryRequest[] memory queries,
        uint256 _ProposalID,
        bool _vote
    ) external payable {
        _checkVoteStatus(_ProposalID, msg.sender);

        for (uint256 i; i < queries.length; i++) {
            QueryType.QueryRequest memory query = queries[i];
            query.height = Proposals[_ProposalID].height;
        }
        bytes memory message = abi.encode(msg.sender, _ProposalID, _vote);
        IGateway(gateway).query{value: msg.value}(
            queries,
            lightClient,
            address(this), // callback address
            message
        );
    }

    function receiveQuery(
        bytes32,
        bytes[] memory results,
        QueryType.QueryRequest[] memory,
        bytes memory message
    ) external onlyGateway {
        (address sender, uint256 ProposalID, bool vote) = abi.decode(
            message,
            (address, uint256, bool)
        );
        bytes memory result = results[0];
        require(result.length > 0, "No right to vote.");
        _castVote(ProposalID, vote, sender);
    }

    /**
     * @dev casts a vote.
     * @param _ProposalID the proposal id
     * @param _vote true for yes, false for no
     */
    function _castVote(
        uint256 _ProposalID,
        bool _vote,
        address _voter
    ) internal validProposal(_ProposalID) {
        _checkVoteStatus(_ProposalID, _voter);

        // uint256 weight = balanceOf(voter);
        uint256 weight = 1;

        // require(weight > 0, "user has no tokens");

        Proposal storage curproposal = Proposals[_ProposalID];

        curproposal.voterInfo[_voter] = Voter({
            hasVoted: true,
            vote: _vote,
            weight: weight
        });

        curproposal.voters.push(_voter);

        emit VoteCasted(_voter, _ProposalID, weight);
    }

    function getAllProposals() external view returns (ProposalData[] memory) {
        ProposalData[] memory proposals = new ProposalData[](ProposalCount);
        for (uint256 i = 1; i < ProposalCount + 1; i++) {
            Proposal storage pro = Proposals[i];
            Voter[] memory voters = new Voter[](pro.voters.length);
            for (uint256 j = 0; j < pro.voters.length; j++) {
                voters[j] = pro.voterInfo[pro.voters[j]];
            }
            proposals[i - 1] = ProposalData(
                i,
                pro.creator,
                pro.status,
                pro.yesVotes,
                pro.noVotes,
                pro.title,
                pro.description,
                pro.voters,
                pro.expirationTime,
                pro.height,
                voters
            );
        }

        return proposals;
    }

    function getProposal(
        uint256 id
    ) external view returns (ProposalData memory) {
        Proposal storage pro = Proposals[id];

        Voter[] memory voters = new Voter[](pro.voters.length);
        for (uint256 i = 0; i < pro.voters.length; i++) {
            voters[i] = pro.voterInfo[pro.voters[i]];
        }

        ProposalData memory proposal = ProposalData(
            id,
            pro.creator,
            pro.status,
            pro.yesVotes,
            pro.noVotes,
            pro.title,
            pro.description,
            pro.voters,
            pro.expirationTime,
            pro.height,
            voters
        );

        return proposal;
    }

    /** @notice Set gateway contract address
     * @param _gateway Gateway contract address
     */
    function setGateway(address _gateway) public onlyOwner {
        gateway = _gateway;
    }

    /** @notice Set light client contract address
     * @param _lightClient Light client contract address
     */
    function setLightClient(address _lightClient) public onlyOwner {
        lightClient = _lightClient;
    }

    function _checkVoteStatus(
        uint256 _ProposalID,
        address _voter
    ) internal view {
        require(
            getProposalStatus(_ProposalID) == ProposalStatus.IN_PROGRESS,
            "proposal has expired."
        );
        require(
            !userHasVoted(_ProposalID, _voter),
            "user already voted on this proposal"
        );
        require(
            getProposalExpirationTime(_ProposalID) > block.timestamp,
            "for this proposal, the voting time expired"
        );
    }

    /**
     * @dev checks if a user has voted
     * @param _ProposalID the proposal id
     * @param _user the address of a voter
     */
    function userHasVoted(
        uint256 _ProposalID,
        address _user
    ) internal view validProposal(_ProposalID) returns (bool) {
        return (Proposals[_ProposalID].voterInfo[_user].hasVoted);
    }

    /**
     * @dev checks if a proposal id is valid
     * @param _ProposalID the proposal id
     */
    modifier validProposal(uint256 _ProposalID) {
        require(
            _ProposalID > 0 && _ProposalID <= ProposalCount,
            "Not a valid Proposal Id"
        );
        _;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway, "Only gateway can call this function");
        _;
    }
}
