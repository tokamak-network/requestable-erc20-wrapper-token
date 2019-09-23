pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "./lib/RLP.sol";
import "./RequestableI.sol";

/**
 * @title   RequestableERC20
 * @notice  RequestableERC20 is a requestable token contract with Compatible ERC20
 */
contract RequestableERC20 is ReentrancyGuard, ERC20Burnable, RequestableI {
  using SafeMath for *;
  using RLP for bytes;
  using RLP for RLP.RLPItem;

  // contract development flag
  bool public development;

  // RootChain contract intialized flag
  bool public initialized;

  // If true, for enter request, holds requestor's token in root chain,
  // for exit request, transfer the tokens from this contract.
  // If false, just mint and burn requestor's token.
  bool public lockInRootChain;

  address public rootchain;

  // Requests
  mapping(uint => bool) appliedRequests;

  // request for allowance(spender, requestor)
  bytes32 constant public KEY_ALLOWANCE = keccak256("RequestableERC20.allowance(address spender, uint256 amount)");

  // request for balanceOf(requestor)
  bytes32 constant public KEY_BALANCES  = keccak256("RequestableERC20.balances()");

  // Events
  event Requested(bool _isExit, address _requestor, bytes32 _trieKey, bytes _trieValue);

  modifier isInitialized() {
    require(initialized);
    _;
  }

  modifier check(bool isRootChain, uint256 requestId) {
    if (!development) {
      address expectedMsgSesnder;
      if (isRootChain) {
        expectedMsgSesnder = rootchain;
      }
      require(msg.sender == expectedMsgSesnder);
    }

    require(!appliedRequests[requestId]);
    _;
    appliedRequests[requestId] = true;
  }

  constructor(bool _development, bool _lockInRootChain, uint256 _initialSupply) public {
    development = _development;
    lockInRootChain = _lockInRootChain;

    if (_initialSupply > 0) {
      _mint(msg.sender, _initialSupply);
    }
  }

  function init(address _rootchain) external returns (bool) {
    require(!initialized);

    rootchain = _rootchain;

    initialized = true;
    return initialized;
  }

  function applyRequestInRootChain(
    bool isExit,
    uint256 requestId,
    address requestor,
    bytes32 trieKey,
    bytes calldata trieValue
  ) external nonReentrant check(true, requestId) returns (bool success) {
    return _applyRequestInRootChain(isExit, requestor, trieKey, trieValue);
  }

  function applyRequestInChildChain(
    bool isExit,
    uint256 requestId,
    address requestor,
    bytes32 trieKey,
    bytes calldata trieValue
  ) external nonReentrant check(false, requestId) returns (bool success) {
    return _applyRequestInChildChain(isExit, requestor, trieKey, trieValue);
  }

  function _applyRequestInRootChain(
    bool isExit,
    address requestor,
    bytes32 trieKey,
    bytes memory trieValue
  ) internal returns (bool success) {
    RLP.RLPItem memory item = trieValue.toRLPItem();

    if (isExit) {
      if (trieKey == KEY_ALLOWANCE) {
        RLP.RLPItem[] memory list = item.toList(2);
        _approve(list[0].toAddress(), requestor, allowance(msg.sender, requestor).add(list[1].toUint()));
      } else if (trieKey == KEY_BALANCES) {
        _increaseBalance(requestor, item.toUint(), true);
      } else {
        // cannot exit other variables.
        // but do nothing to return false.
        return false;
      }
    } else {
      // apply enter
      if (trieKey == KEY_ALLOWANCE) {
        RLP.RLPItem[] memory list = item.toList(2);
        _approve(list[0].toAddress(), requestor, allowance(msg.sender, requestor).sub(list[1].toUint()));
      } else if (trieKey == KEY_BALANCES) {
        _decreaseBalance(requestor, item.toUint(), true);
      } else {
        revert();
      }
    }

    emit Requested(isExit, requestor, trieKey, trieValue);
    return true;
  }

  function _applyRequestInChildChain(
    bool isExit,
    address requestor,
    bytes32 trieKey,
    bytes memory trieValue
  ) internal returns (bool success) {
    RLP.RLPItem memory item = trieValue.toRLPItem();

    if (isExit) {
      if (trieKey == KEY_ALLOWANCE) {
        RLP.RLPItem[] memory list = item.toList(2);
        _approve(list[0].toAddress(), requestor, allowance(msg.sender, requestor).sub(list[1].toUint()));
      } else if (trieKey == KEY_BALANCES) {
        _decreaseBalance(requestor, item.toUint(), false);
      } else { // cannot exit other variables.
        revert();
      }
    } else {
      // apply enter
      if (trieKey == KEY_ALLOWANCE) {
        RLP.RLPItem[] memory list = item.toList(2);
        _approve(list[0].toAddress(), requestor, allowance(msg.sender, requestor).add(list[1].toUint()));
      } else if (trieKey == KEY_BALANCES) {
        _increaseBalance(requestor, item.toUint(), false);
      } else {
        // cannot apply request on other variables.
        revert();
      }
    }

    emit Requested(isExit, requestor, trieKey, trieValue);
    return true;
  }

  function _increaseBalance(address who, uint256 amount, bool isRootChain) internal {
    if (!isRootChain) return _mint(who, amount);
    if (lockInRootChain) return _transfer(address(this), who, amount);
    _mint(who, amount);
  }

  function _decreaseBalance(address who, uint256 amount, bool isRootChain) internal {
    if (!isRootChain) return _burn(who, amount);
    if (lockInRootChain) return _transfer(who, address(this), amount);
    _burn(who, amount);
  }
}
