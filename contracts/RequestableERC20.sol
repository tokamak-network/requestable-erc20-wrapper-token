pragma solidity ^0.5.0;

import "./lib/SafeMath.sol";
import "./lib/ERC20Burnerble.sol";
import "./RequestableI.sol";

/**
 * @title   RequestableERC20
 * @notice  RequestableERC20 is a requestable token contract with Compatible ERC20
 */
contract RequestableERC20 is ERC20Burnable, RequestableI {
  using SafeMath for *;

  bool public initialized;
  bool public development;
  address public rootchain;

  // Requests
  mapping(uint => bool) appliedRequests;

  bytes32 constant public KEY_TOTAL_SUPPLY  = 0x0000000000000000000000000000000000000000000000000000000000000001;
  bytes32 constant public PERFIX_BALANCES   = 0x0000000000000000000000000000000000000000000000000000000000000002;

  // Events
  event Requested(bool _isExit, address _requestor, bytes32 _trieKey, bytes _trieValue);

  modifier isInitialized() {
    require(initialized);
    _;
  }

  constructor(bool _development) public {
    development = _development;
  }

  function init(address _rootchain) external returns (bool) {
    require(!initialized);

    rootchain = _rootchain;

    initialized = true;
    return initialized;
  }

//  function _mint(address _to, uint _amount) internal {
//    _totalSupply = _totalSupply.add(_amount);
//    _balances[_to] = _balances[_to].add(_amount);
//    emit Transfer(address(0), _to, _amount);
//  }
//
//  function _burn(address _from, uint _amount) internal {
//    _balances[_from] = _balances[_from].sub(_amount);
//    _totalSupply = _totalSupply.sub(_amount);
//    emit Transfer(_from, address(0), _amount);
//  }

  // User can get the trie key of one's balance and make an enter request directly.
  function getBalanceTrieKey(address who) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(bytes32(bytes20(who)), PERFIX_BALANCES));
  }

  function applyRequestInRootChain(
    bool isExit,
    uint256 requestId,
    address requestor,
    bytes32 trieKey,
    bytes calldata trieValue
  ) external returns (bool success) {
    if (!development) {
      require(msg.sender == address(rootchain));
    }
    require(!appliedRequests[requestId]);

    if (isExit) {
      if (KEY_TOTAL_SUPPLY == trieKey) {
        // no one can exit `totalSupply` variable.
        // but do nothing to return true.
      } else if (getBalanceTrieKey(requestor) == trieKey) {
        // this checks trie key equals to `balances[requestor]`.
        // only token holder can exit one's token.
        // exiting means moving tokens from child chain to root chain.
        _mint(requestor, decodeTrieValue(trieValue));
      } else {
        // cannot exit other variables.
        // but do nothing to return true.
      }
    } else {
      // apply enter
      if (KEY_TOTAL_SUPPLY == trieKey) {
        // no one can enter `totalSupply` variable.
        revert();
      } else if (getBalanceTrieKey(requestor) == trieKey) {
        // this checks trie key equals to `balance[requestor]`.
        // only token holder can enter one's token.
        // entering means moving tokens from root chain to child chain.
        require(balanceOf(requestor) >= decodeTrieValue(trieValue));
        _burn(requestor, decodeTrieValue(trieValue));
      } else {
        // cannot apply request on other variables.
        revert();
      }
    }

    appliedRequests[requestId] = true;

    emit Requested(isExit, requestor, trieKey, trieValue);

    // TODO: adpot RootChain
    // setRequestApplied(requestId);
    return true;
  }

  // this is only called by NULL_ADDRESS in child chain
  // when i) exitRequest is initialized by startExit() or
  //     ii) enterRequest is initialized
  function applyRequestInChildChain(
    bool isExit,
    uint256 requestId,
    address requestor,
    bytes32 trieKey,
    bytes calldata trieValue
  ) external returns (bool success) {
    if (!development) {
      require(msg.sender == address(0));
    }
    require(!appliedRequests[requestId]);

    if (isExit) {
      if (KEY_TOTAL_SUPPLY == trieKey) {
        // no one can exit `totalSupply` variable.
        revert();
      } else if (getBalanceTrieKey(requestor) == trieKey) {
        // this checks trie key equals to `balances[tokenHolder]`.
        // only token holder can exit one's token.
        // exiting means moving tokens from child chain to root chain.

        // revert provides a proof for `exitChallenge`.
        require(balanceOf(requestor) >= decodeTrieValue(trieValue));

        _burn(requestor, decodeTrieValue(trieValue));
      } else { // cannot exit other variables.
        revert();
      }
    } else {
      // apply enter
      if (KEY_TOTAL_SUPPLY == trieKey) {
        // no one can enter `totalSupply` variable.
      } else if (getBalanceTrieKey(requestor) == trieKey) {
        // this checks trie key equals to `balances[tokenHolder]`.
        // only token holder can enter one's token.
        // entering means moving tokens from root chain to child chain.
        _mint(requestor, decodeTrieValue(trieValue));
      } else {
        // cannot apply request on other variables.
        revert();
      }
    }

    appliedRequests[requestId] = true;

    emit Requested(isExit, requestor, trieKey, trieValue);
    return true;
  }

  function decodeTrieValue(bytes memory trieValue) public pure returns (uint v) {
    require(trieValue.length == 0x20);

    assembly {
       v := mload(add(trieValue, 0x20))
    }
  }
}
