pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "./lib/RLP.sol";
import "./RequestableERC20.sol";

/**
 * @title   RequestableERC20
 * @notice  RequestableERC20 is a requestable token contract with Compatible ERC20
 */
contract RequestableERC20Mintable is RequestableERC20, ERC20Mintable {
  using SafeMath for *;
  using RLP for bytes;
  using RLP for RLP.RLPItem;

  address[] public minters;

  // request for other minter role
  bytes32 constant public KEY_MINTERS = keccak256("RequestableERC20Mintable.minters(address account, bool remove)");

  constructor(bool _development, bool _lockInRootChain)
    RequestableERC20(_development, _lockInRootChain, 0)
    public
  {
    minters.push(msg.sender);
  }

  function getMinters() public view returns (address[] memory) {
    return minters;
  }

  function _addMinter(address account) internal {
    minters.push(account);
    super._addMinter(account);
  }

  function _removeMinter(address account) internal {
    for (uint i = 0; i < minters.length; i++) {
      if (minters[i] == account) {
        minters[i] = minters[minters.length - 1];
        delete minters[minters.length - 1];
        minters.length--;
      }
    }

    super._removeMinter(account);
  }

  function _applyRequestInRootChain(
    bool isExit,
    address requestor,
    bytes32 trieKey,
    bytes memory trieValue
  ) internal returns (bool success) {
    if (trieKey != KEY_MINTERS) {
      return super._applyRequestInRootChain(isExit, requestor, trieKey, trieValue);
    }

    RLP.RLPItem[] memory list = trieValue.toRLPItem().toList(2);
    address minter = list[0].toAddress();
    bool remove = (list[1].toUint() != 0);

    if (isExit) {
      if (remove) {
        if (isMinter(minter)) _removeMinter(minter);
      } else {
        if (!isMinter(minter)) _addMinter(minter);
      }
    } else {
      if (remove) require(!isMinter(minter));
      else require(isMinter(minter));
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
    if (trieKey != KEY_MINTERS) {
      return super._applyRequestInChildChain(isExit, requestor, trieKey, trieValue);
    }

    RLP.RLPItem[] memory list = trieValue.toRLPItem().toList(2);
    address minter = list[0].toAddress();
    bool remove = (list[1].toUint() != 0);

    if (isExit) {
      if (remove) require(!isMinter(minter));
      else require(isMinter(minter));
    } else {
      if (remove) {
        if (isMinter(minter)) _removeMinter(minter);
      } else {
        if (!isMinter(minter)) _addMinter(minter);
      }
    }

    emit Requested(isExit, requestor, trieKey, trieValue);
    return true;
  }
}
