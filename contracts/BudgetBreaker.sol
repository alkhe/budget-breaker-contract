pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract BudgetBreaker {
  enum ContractState { NOT_EXECUTED, EXECUTORY, DISBURSED }
  enum MemberState { DNE, NOT_SIGNED, SIGNED }

  ContractState contractState = ContractState.NOT_EXECUTED;
  mapping (address => MemberState) memberStates;

  IERC20 public token;

  // address held by web2 service. members and residual claimant should not have access to this
  address controller;

  // members of the team
  address[] members;

  // residual claimant e.g. charitable organization
  address residualAddress;

  // target output in tokens
  uint256 target;

  // amount disbursed to each member if target output is achieved
  uint256 targetShare;

  // in UTC milliseconds. contract must be signed by members and executed by controller before this time
  uint256 executeByTime;

  // in UTC milliseconds. contract can only be completed by controller after this time
  uint256 completionTime;

  // number of team members
  uint8 totalMembers;

  // in UTC milliseconds. contract created at this time
  uint256 public createdTime = block.timestamp * 1000;

  constructor(
    address _token,
    address _controller, address _residualAddress, address[] memory _members,
    uint256 _target, uint256 _targetShare,
    uint256 _executeByTime, uint256 _completionTime
  ) {
    require(block.timestamp * 1000 < _executeByTime, 'Execution deadline must be after creation time.');
    require(_executeByTime < _completionTime, 'Completion deadline must be after execution deadline.');

    totalMembers = uint8(_members.length);

    require(totalMembers * _targetShare <= _target, 'Total disbursement to members must not exceed target output.');

    token = IERC20(_token);

    controller = _controller;
    residualAddress = _residualAddress;
    members = _members;

    target = _target;
    targetShare = _targetShare;

    executeByTime = _executeByTime;
    completionTime = _completionTime;

    for (uint8 i = 0; i < totalMembers; i++) {
      memberStates[members[i]] = MemberState.NOT_SIGNED;
    }
  }

  function balance() view external returns(uint256) {
    return token.balanceOf(address(this));
  }

  function sign() onlyMembers requireNotExecuted before(executeByTime) external {
    memberStates[tx.origin] = MemberState.SIGNED;
  }

  function execute() onlyFrom(controller) requireNotExecuted requireAllSigned before(executeByTime) external {
    contractState = ContractState.EXECUTORY;
  }

  function complete() onlyFrom(controller) requireExecutory since(completionTime) external {
    if (token.balanceOf(address(this)) >= target) {
      for (uint i = 0; i < totalMembers; i++) {
        token.transfer(members[i], targetShare);
      }
    }

    token.transfer(residualAddress, token.balanceOf(address(this)));

    contractState = ContractState.DISBURSED;
  }

  modifier onlyFrom(address _address) {
    require(tx.origin == _address, 'Caller not authorized.');
    _;
  }

  modifier onlyMembers {
    require(memberStates[tx.origin] != MemberState.DNE, 'This method can only be called by a member.');
    _;
  }

  modifier requireNotExecuted {
    require(contractState == ContractState.NOT_EXECUTED, 'This method can only be called when the contracted has not been executed.');
    _;
  }

  modifier requireExecutory {
    require(contractState == ContractState.EXECUTORY, 'This method can only be called during the contract\'s executory period.');
    _;
  }

  modifier requireAllSigned {
    for (uint8 i = 0; i < totalMembers; i++) {
      require(memberStates[members[i]] == MemberState.SIGNED, 'This method can only be called after all members have signed.');
    }
    _;
  }

  modifier before(uint256 time) {
    require(block.timestamp * 1000 < time, 'It is too late to call this method.');
    _;
  }

  modifier since(uint256 time) {
    require(block.timestamp * 1000 >= time, 'It is too early to call this method.');
    _;
  }
}

