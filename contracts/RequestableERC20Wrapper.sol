pragma solidity ^0.4.24;

import "./lib/SafeMath.sol";
import "./lib/ERC20.sol";
import "./lib/StandardToken.sol";


/**
 * @title   RequestableERC20Wrapper
 * @notice  RequestableERC20Wrapper is a requestable token contract that can exchange
 *          another base ERC20 token.
 */
contract RequestableERC20Wrapper is StandardToken {
  using SafeMath for *;

  bool public initialized;
  bool public development;
  address public rootchain;
  ERC20 public token;


  /* Events */
  event Depositted(address _from, uint _value);
  event Withdrawn(address _from, uint _value);
  event RequestCreated(bool _isExit, address _requestor, bytes32 _trieKey, bytes32 _trieValue);

  modifier isInitialized() {
    require(initialized);
    _;
  }

  constructor(bool _development, ERC20 _token) public {
    development = _development;
    token = _token;
  }

  function init(address _rootchain) external returns (bool) {
    require(!initialized);

    rootchain = _rootchain;
    initialized = true;
  }

  function deposit(uint _amount) external isInitialized returns (bool) {
    mint(msg.sender, _amount);
    emit Depositted(msg.sender, _amount);
    require(token.transferFrom(msg.sender, this, _amount));

    return true;
  }

  function withdraw(uint _amount) external isInitialized returns (bool) {
    burn(msg.sender, _amount);
    emit Withdrawn(msg.sender, _amount);
    require(token.transfer(msg.sender, _amount));

    return true;
  }

  function getBalanceTrieKey(address _who) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(bytes32(0), _who));
  }

  function applyRequestInRootChain(
    bool isExit,
    uint256 requestId,
    address requestor,
    bytes32 trieKey,
    bytes32 trieValue
  ) external isInitialized returns (bool success) {
    require(msg.sender == address(rootchain));
    require(trieKey == getBalanceTrieKey(requestor));

    if (isExit) {
      mint(requestor, uint(trieValue));
    } else {
      burn(requestor, uint(trieValue));
    }

    emit RequestCreated(isExit, requestor, trieKey, trieValue);

    return true;
  }

  function applyRequestInChildChain(
    bool isExit,
    uint256 requestId,
    address requestor,
    bytes32 trieKey,
    bytes32 trieValue
  ) external isInitialized returns (bool success) {
    require(development || msg.sender == address(0));
    require(trieKey == getBalanceTrieKey(requestor));

    if (isExit) {
      burn(requestor, uint(trieValue));
    } else {
      mint(requestor, uint(trieValue));
    }

    emit RequestCreated(isExit, requestor, trieKey, trieValue);

    return true;
  }


  function mint(address _to, uint _amount) internal {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Transfer(address(0), _to, _amount);
  }

  function burn(address _from, uint _amount) internal {
    balances[_from] = balances[_from].sub(_amount);
    totalSupply_ = totalSupply_.sub(_amount);
    emit Transfer(_from, address(0), _amount);
  }

}
