pragma solidity ^0.5.0;

import "./lib/SafeMath.sol";
import "./lib/MinterRole.sol";
import "./RequestableERC20.sol";

/**
 * @title   RequestableERC20
 * @notice  RequestableERC20 is a requestable token contract with Compatible ERC20
 */
contract RequestableERC20Mintable is RequestableERC20, MinterRole {
  using SafeMath for *;

  bool public initialized;
  bool public development;
  address public rootchain;

  address[] public minters;

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

  constructor(bool _development) RequestableERC20(_development) public {
    development = _development;

    minters.push(_msgSender());
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

  /**
   * @dev getter function to view minters/burners list.
   */
  function getMinters() public view returns (address[] memory) {
    return minters;
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
}
