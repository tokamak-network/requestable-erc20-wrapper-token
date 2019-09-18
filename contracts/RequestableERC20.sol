pragma solidity ^0.5.0;

import "./lib/SafeMath.sol";
import "./lib/ERC20.sol";
import "./RequestableI.sol";
import "./lib/StandardToken.sol";
import "./lib/MinterRole.sol";
import "./lib/BurnerRole.sol";

/**
 * @title   RequestableERC20
 * @notice  RequestableERC20 is a requestable token contract with Compatible ERC20
 */
contract RequestableERC20 is StandardToken, RequestableI, MinterRole, BurnerRole {
  using SafeMath for *;

  bool public initialized;
  bool public development;
  address public rootchain;

  address[] public minters;
  address[] public burners;

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

  constructor(bool _development) MinterRole() BurnerRole() public {
    development = _development;

    minters.push(_msgSender());
    burners.push(_msgSender());
  }

  function init(address _rootchain) external returns (bool) {
    require(!initialized);

    rootchain = _rootchain;

    initialized = true;
    return initialized;
  }

  /**
   * @dev Minters only can mint token, default deployer belongs into minters
   * After Token minted all on your contract purpose.
   * then may you activate `renounceMinter()`
   * @param account address The address which minter want to increase token amount.
   * @param amount uint256 The Amount of Token minted by minter belongs minters.
   */
  function mint(address account, uint256 amount) public onlyMinter returns (bool) {
        _mint(account, amount);
        return true;
  }

  function burn(address account, uint256 amount) public onlyBurner returns (bool) {
        _burn(account, amount);
        return true;
  }

  function _mint(address _to, uint _amount) internal {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Transfer(address(0), _to, _amount);
  }

  function _burn(address _from, uint _amount) internal {
    balances[_from] = balances[_from].sub(_amount);
    totalSupply_ = totalSupply_.sub(_amount);
    emit Transfer(_from, address(0), _amount);
  }

  /**
   * @dev getter function to view minters/burners list.
   */
  function getMinters() public view returns (address[] memory) {
    return minters;
  }

  function getBurners() public view returns (address[] memory) {
    return burners;
  }

  /**
   * @dev only mint/burn this token who belongs in minters or burners.
   * account pushed when this deployed on constructor method.
   * @param account address The address who belongs to Minters or Burners.
   */
  function addMinter(address account) public onlyMinter {
    minters.push(account);
    super.addMinter(account);
  }

  function addBurner(address account) public onlyBurner {
    burners.push(account);
    super.addBurner(account);
  }

  /**
   * @dev deployer is already in minters and burners array.
   */
  function renounceMinter() public {
    // swap and delete minters array.
    bool mintersEmpty = (minters.length != 0);
    require(mintersEmpty, "There is no minters left");

    if (minters.length > 1) {
      for (uint i=0; i < minters.length; i++) {
        if (minters[i] == _msgSender()) {
          minters[i] = minters[minters.length - 1];
          delete minters[minters.length - 1];
          minters.length--;
        }
      }
    } else {
        if (minters[0] == _msgSender()) {
          delete minters;
        }
    }

    super.renounceMinter();
  }

  function renounceBurner() public {
    // swap and delete burners array.
    bool burnersEmpty = (burners.length != 0);
    require(burnersEmpty, "There is no burners left");

    if (burners.length > 1) {
      for (uint i=0; i < burners.length; i++) {
        if (burners[i] == _msgSender()) {
          burners[i] = burners[burners.length - 1];
          delete burners[burners.length - 1];
          burners.length--;
        }
      }
    } else {
        if (burners[0] == _msgSender()) {
          delete burners;
        }
    }

    super.renounceBurner();
  }

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
        mint(requestor, decodeTrieValue(trieValue));
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
        // this checks trie key equals to `balances[requestor]`.
        // only token holder can enter one's token.
        // entering means moving tokens from root chain to child chain.
        require(balances[requestor] >= decodeTrieValue(trieValue));
        burn(requestor, decodeTrieValue(trieValue));
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
        require(balances[requestor] >= decodeTrieValue(trieValue));

        burn(requestor, decodeTrieValue(trieValue));
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
        mint(requestor, decodeTrieValue(trieValue));
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
